import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(key)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = session as Stripe.Checkout.Session
      const userId = cs.metadata?.userId
      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          plan: 'pro',
          stripe_customer_id: cs.customer as string,
          stripe_subscription_id: cs.subscription as string,
          updated_at: new Date().toISOString(),
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = session as Stripe.Subscription
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('stripe_subscription_id', sub.id).single()
      if (data?.id) {
        await supabaseAdmin.from('profiles').update({ plan: 'free', stripe_subscription_id: null, updated_at: new Date().toISOString() }).eq('id', data.id)
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = session as Stripe.Subscription
      const active = sub.status === 'active' || sub.status === 'trialing'
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('stripe_subscription_id', sub.id).single()
      if (data?.id) {
        await supabaseAdmin.from('profiles').update({ plan: active ? 'pro' : 'free', updated_at: new Date().toISOString() }).eq('id', data.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
