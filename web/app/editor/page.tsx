import { Suspense } from 'react'
import EditorClient from './EditorClient'

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-gray-500 text-sm">불러오는 중...</p>
        </div>
      </div>
    }>
      <EditorClient />
    </Suspense>
  )
}
