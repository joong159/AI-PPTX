import re
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_BG_LIGHT = RGBColor(248, 250, 252)

# Default Design Tokens (Nordic Tech)
DEFAULT_THEME = {
    "bg_dark": RGBColor(15, 23, 42),       # Slate 900
    "bg_light": RGBColor(248, 250, 252),   # Slate 50
    "primary_text": RGBColor(30, 41, 59),  # Slate 800
    "secondary_text": RGBColor(71, 85, 105), # Slate 600
    "accent": RGBColor(79, 70, 229),       # Indigo 600
    "accent_light": RGBColor(129, 140, 248), # Indigo 400
    "accent_bg": RGBColor(238, 242, 255),  # Indigo 50
    "font_title": "Malgun Gothic",
    "font_body": "Malgun Gothic"
}

# Theme palette registry
THEMES = {
    "Nordic Tech (Ice White & Indigo)": DEFAULT_THEME,
    "Obsidian Dark (Slate Dark & Cyan)": {
        "bg_dark": RGBColor(15, 23, 42),       # Slate 900
        "bg_light": RGBColor(30, 41, 59),      # Slate 800
        "primary_text": RGBColor(255, 255, 255), # White
        "secondary_text": RGBColor(148, 163, 184), # Slate 400
        "accent": RGBColor(6, 182, 212),       # Cyan 500
        "accent_light": RGBColor(103, 232, 249), # Cyan 300
        "accent_bg": RGBColor(21, 94, 117),     # Cyan 800
        "font_title": "Malgun Gothic",
        "font_body": "Malgun Gothic"
    },
    "Emerald Business (Mint & Forest)": {
        "bg_dark": RGBColor(6, 78, 59),        # Emerald 900
        "bg_light": RGBColor(240, 253, 250),   # Emerald 50
        "primary_text": RGBColor(15, 23, 42),   # Slate 900
        "secondary_text": RGBColor(55, 65, 81), # Gray 700
        "accent": RGBColor(5, 150, 105),       # Emerald 600
        "accent_light": RGBColor(110, 231, 183), # Emerald 300
        "accent_bg": RGBColor(209, 250, 229),   # Emerald 100
        "font_title": "Malgun Gothic",
        "font_body": "Malgun Gothic"
    },
    "Sunset Warm (Cream & Terracotta)": {
        "bg_dark": RGBColor(67, 20, 7),        # Rust 900
        "bg_light": RGBColor(255, 251, 235),   # Amber 50
        "primary_text": RGBColor(69, 26, 3),    # Amber 950
        "secondary_text": RGBColor(120, 53, 4), # Amber 800
        "accent": RGBColor(217, 119, 6),       # Amber 600
        "accent_light": RGBColor(252, 211, 77), # Amber 300
        "accent_bg": RGBColor(254, 243, 199),   # Amber 100
        "font_title": "Malgun Gothic",
        "font_body": "Malgun Gothic"
    }
}

def set_slide_background(slide, prs, color):
    """Sets a solid background color using a full-slide rectangle."""
    rect = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    rect.fill.solid()
    rect.fill.fore_color.rgb = color
    rect.line.fill.background()  # No border

def add_header(slide, title_text, colors, left, top, width):
    """Adds a modern title header with an indigo underline."""
    title_box = slide.shapes.add_textbox(left, top, width, Inches(0.8))
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.name = colors["font_title"]
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = colors["primary_text"]
    
    # Accent Line (Indigo Underline)
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, left, top + Inches(0.8), Inches(1.5), Inches(0.04)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = colors["accent"]
    line.line.fill.background()

def add_takeaway_banner(slide, text, colors, left, top, width, height):
    """Adds an indigo-tinted key takeaway banner at the bottom of the slide."""
    if not text:
        return
        
    banner = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    banner.fill.solid()
    banner.fill.fore_color.rgb = colors["accent_bg"]
    banner.line.fill.background()
    
    tf = banner.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_top = Inches(0.15)
    tf.margin_right = Inches(0.3)
    tf.margin_bottom = Inches(0.15)
    
    p = tf.paragraphs[0]
    p.text = f"💡 Key Takeaway: {text}"
    p.font.name = colors["font_body"]
    p.font.size = Pt(13)
    p.font.italic = True
    p.font.color.rgb = colors["accent"]

def add_textbox_content(slide, text_list, colors, left, top, width, height, font_size=15):
    """Utility to add standard bullet text list inside a textbox."""
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    first = True
    for bullet in text_list:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.text = f"•  {bullet}"
        p.font.name = colors["font_body"]
        p.font.size = Pt(font_size)
        p.font.color.rgb = colors["secondary_text"]
        p.space_after = Pt(10)
    return box

def compile_presentation(data, output_filename_or_stream, theme_name=None, deck_format="Standard (16:9)"):
    """Parses JSON data and compiles a clean, modern PowerPoint file."""
    colors = DEFAULT_THEME
    if theme_name and theme_name in THEMES:
        colors = THEMES[theme_name]
        
    prs = Presentation()
    
    # Layout configuration mapping based on format
    is_vertical = deck_format == "Social Carousel (4:5)"
    
    if is_vertical:
        prs.slide_width = Inches(8.0)
        prs.slide_height = Inches(10.0)
        
        margin_left = Inches(0.8)
        content_width = Inches(6.4)
        header_top = Inches(0.6)
        content_top = Inches(1.8)
        content_height = Inches(6.0)
        takeaway_top = Inches(8.4)
        takeaway_height = Inches(1.0)
        
        title_top = Inches(2.8)
        title_height = Inches(4.0)
    else: # Default: 16:9
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)
        
        margin_left = Inches(1.0)
        content_width = Inches(11.33)
        header_top = Inches(0.6)
        content_top = Inches(1.8)
        content_height = Inches(3.8)
        takeaway_top = Inches(5.9)
        takeaway_height = Inches(0.8)
        
        title_top = Inches(2.2)
        title_height = Inches(4.0)
        
    blank_layout = prs.slide_layouts[6]
    
    # --- Slide 0: Title Slide ---
    slide = prs.slides.add_slide(blank_layout)
    set_slide_background(slide, prs, colors["bg_dark"])
    
    # Accent colored top bar
    top_bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.15)
    )
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = colors["accent"]
    top_bar.line.fill.background()
    
    # Title Text Frame
    title_box = slide.shapes.add_textbox(margin_left, title_top, content_width, title_height)
    tf = title_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p_title = tf.paragraphs[0]
    p_title.text = data.get("presentation_title", "AI Generated Presentation")
    p_title.font.name = colors["font_title"]
    p_title.font.size = Pt(38 if is_vertical else 44)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE if colors["bg_dark"] != COLOR_BG_LIGHT else colors["primary_text"]
    p_title.space_after = Pt(20)
    
    p_sub = tf.add_paragraph()
    p_sub.text = data.get("presentation_subtitle", "Generated by Snapdeck PPT AI Engine")
    p_sub.font.name = colors["font_body"]
    p_sub.font.size = Pt(16 if is_vertical else 18)
    p_sub.font.color.rgb = colors["accent_light"]
    
    # --- Slides 1+: Content Slides ---
    for item in data.get("slides", []):
        slide = prs.slides.add_slide(blank_layout)
        slide_type = item.get("slide_type", "title_and_content")
        
        if slide_type == "section_header":
            # Dark Blue/Indigo Divider slide
            set_slide_background(slide, prs, colors["accent"])
            
            box = slide.shapes.add_textbox(margin_left, Inches(3.0) if is_vertical else Inches(2.5), content_width, Inches(3.5))
            tf = box.text_frame
            tf.word_wrap = True
            
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            p.text = item.get("title", "")
            p.font.name = colors["font_title"]
            p.font.size = Pt(32 if is_vertical else 36)
            p.font.bold = True
            p.font.color.rgb = COLOR_WHITE
            p.space_after = Pt(14)
            
            p_sub = tf.add_paragraph()
            p_sub.alignment = PP_ALIGN.CENTER
            p_sub.text = item.get("summary", "")
            p_sub.font.name = colors["font_body"]
            p_sub.font.size = Pt(15 if is_vertical else 16)
            p_sub.font.color.rgb = colors["accent_bg"]
            
        elif slide_type == "big_stat":
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            if is_vertical:
                # Stack stat and description vertically on 4:5
                stat_box = slide.shapes.add_textbox(margin_left, Inches(2.2), content_width, Inches(2.5))
                tf_stat = stat_box.text_frame
                tf_stat.word_wrap = True
                
                p_val = tf_stat.paragraphs[0]
                p_val.text = item.get("stat_value", "100%")
                p_val.font.name = colors["font_title"]
                p_val.font.size = Pt(64)
                p_val.font.bold = True
                p_val.font.color.rgb = colors["accent"]
                
                p_desc = tf_stat.add_paragraph()
                p_desc.text = item.get("stat_description", "Metric Details")
                p_desc.font.name = colors["font_body"]
                p_desc.font.size = Pt(15)
                p_desc.font.bold = True
                p_desc.font.color.rgb = colors["primary_text"]
                
                content_box = slide.shapes.add_textbox(margin_left, Inches(4.5), content_width, Inches(3.6))
                tf_content = content_box.text_frame
            else:
                # Columns side-by-side on 16:9
                stat_box = slide.shapes.add_textbox(margin_left, Inches(2.2), Inches(4.5), Inches(3.2))
                tf_stat = stat_box.text_frame
                tf_stat.word_wrap = True
                
                p_val = tf_stat.paragraphs[0]
                p_val.text = item.get("stat_value", "100%")
                p_val.font.name = colors["font_title"]
                p_val.font.size = Pt(72)
                p_val.font.bold = True
                p_val.font.color.rgb = colors["accent"]
                p_val.space_after = Pt(10)
                
                p_desc = tf_stat.add_paragraph()
                p_desc.text = item.get("stat_description", "Metric Details")
                p_desc.font.name = colors["font_body"]
                p_desc.font.size = Pt(16)
                p_desc.font.bold = True
                p_desc.font.color.rgb = colors["primary_text"]
                
                content_box = slide.shapes.add_textbox(Inches(6.0), Inches(2.2), Inches(6.33), Inches(3.2))
                tf_content = content_box.text_frame
            
            tf_content.word_wrap = True
            tf_content.margin_left = tf_content.margin_top = 0
            
            first = True
            for bullet in item.get("bullets", []):
                p = tf_content.paragraphs[0] if first else tf_content.add_paragraph()
                first = False
                p.text = f"•  {bullet}"
                p.font.name = colors["font_body"]
                p.font.size = Pt(14 if is_vertical else 15)
                p.font.color.rgb = colors["secondary_text"]
                p.space_after = Pt(12)
                
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
        elif slide_type == "two_column":
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            bullets = item.get("bullets", [])
            half = len(bullets) // 2
            left_bullets = bullets[:half] if half > 0 else bullets
            right_bullets = bullets[half:] if half > 0 else []
            
            if is_vertical:
                # Vertical stack for two columns in 4:5
                add_textbox_content(slide, left_bullets, colors, margin_left, content_top, content_width, Inches(3.0), font_size=14)
                if right_bullets:
                    add_textbox_content(slide, right_bullets, colors, margin_left, content_top + Inches(3.2), content_width, Inches(3.0), font_size=14)
            else:
                # Side-by-side columns in 16:9
                col_w = (content_width - Inches(0.8)) / 2
                add_textbox_content(slide, left_bullets, colors, margin_left, content_top, col_w, content_height, font_size=15)
                if right_bullets:
                    add_textbox_content(slide, right_bullets, colors, margin_left + col_w + Inches(0.8), content_top, col_w, content_height, font_size=15)
                    
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
        elif slide_type == "three_cards":
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            # Extract cards payload, fall back to parsing bullets list if cards list isn't provided
            cards = item.get("cards", [])
            if not cards:
                bullets = item.get("bullets", [])
                cards = [{"card_title": f"Point {idx+1}", "card_content": bullet} for idx, bullet in enumerate(bullets[:3])]
                
            if is_vertical:
                # Vertical stack
                card_h = Inches(1.8)
                spacing = Inches(0.2)
                for idx, card in enumerate(cards[:3]):
                    card_top = content_top + idx * (card_h + spacing)
                    
                    # Draw rounded card shape
                    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, margin_left, card_top, content_width, card_h)
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = colors["accent_bg"]
                    shape.line.fill.background()
                    
                    tf = shape.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = Inches(0.15)
                    
                    p_title = tf.paragraphs[0]
                    p_title.text = card.get("card_title", "")
                    p_title.font.name = colors["font_title"]
                    p_title.font.size = Pt(15)
                    p_title.font.bold = True
                    p_title.font.color.rgb = colors["accent"]
                    p_title.space_after = Pt(4)
                    
                    p_content = tf.add_paragraph()
                    p_content.text = card.get("card_content", "")
                    p_content.font.name = colors["font_body"]
                    p_content.font.size = Pt(12)
                    p_content.font.color.rgb = colors["primary_text"]
            else:
                # Horizontal cards
                card_w = (content_width - Inches(0.8)) / 3
                spacing = Inches(0.4)
                for idx, card in enumerate(cards[:3]):
                    card_left = margin_left + idx * (card_w + spacing)
                    
                    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_left, content_top, card_w, content_height - Inches(0.2))
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = colors["accent_bg"]
                    shape.line.fill.background()
                    
                    tf = shape.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = Inches(0.2)
                    tf.margin_right = Inches(0.2)
                    
                    p_title = tf.paragraphs[0]
                    p_title.text = card.get("card_title", "")
                    p_title.font.name = colors["font_title"]
                    p_title.font.size = Pt(16)
                    p_title.font.bold = True
                    p_title.font.color.rgb = colors["accent"]
                    p_title.space_after = Pt(8)
                    
                    p_content = tf.add_paragraph()
                    p_content.text = card.get("card_content", "")
                    p_content.font.name = colors["font_body"]
                    p_content.font.size = Pt(13)
                    p_content.font.color.rgb = colors["primary_text"]
                    
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
        elif slide_type == "timeline":
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            steps = item.get("timeline_steps", [])
            if not steps:
                bullets = item.get("bullets", [])
                steps = [{"step_title": f"Phase {idx+1}", "step_desc": bullet} for idx, bullet in enumerate(bullets[:4])]
                
            if is_vertical:
                # Vertical Timeline (Vertical Line down the center-left, steps on the right)
                line_left = margin_left + Inches(0.5)
                line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, line_left, content_top, Inches(0.04), Inches(5.8))
                line.fill.solid()
                line.fill.fore_color.rgb = colors["accent_light"]
                line.line.fill.background()
                
                step_h = Inches(1.3)
                for idx, step in enumerate(steps[:4]):
                    step_top = content_top + idx * Inches(1.4)
                    
                    # Timeline Dot
                    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, line_left - Inches(0.13), step_top + Inches(0.2), Inches(0.3), Inches(0.3))
                    circle.fill.solid()
                    circle.fill.fore_color.rgb = colors["accent"]
                    circle.line.fill.background()
                    
                    # Step contents on the right
                    box = slide.shapes.add_textbox(line_left + Inches(0.4), step_top, content_width - Inches(0.9), step_h)
                    tf = box.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = 0
                    
                    p_title = tf.paragraphs[0]
                    p_title.text = step.get("step_title", "")
                    p_title.font.name = colors["font_title"]
                    p_title.font.size = Pt(14)
                    p_title.font.bold = True
                    p_title.font.color.rgb = colors["primary_text"]
                    p_title.space_after = Pt(2)
                    
                    p_desc = tf.add_paragraph()
                    p_desc.text = step.get("step_desc", "")
                    p_desc.font.name = colors["font_body"]
                    p_desc.font.size = Pt(11)
                    p_desc.font.color.rgb = colors["secondary_text"]
            else:
                # Horizontal Timeline
                line_top = content_top + Inches(1.3)
                line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, margin_left, line_top, content_width, Inches(0.04))
                line.fill.solid()
                line.fill.fore_color.rgb = colors["accent_light"]
                line.line.fill.background()
                
                num_steps = min(len(steps), 4)
                step_w = content_width / num_steps
                
                for idx, step in enumerate(steps[:num_steps]):
                    step_left = margin_left + idx * step_w
                    
                    # Timeline Dot
                    circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, step_left + (step_w / 2) - Inches(0.15), line_top - Inches(0.13), Inches(0.3), Inches(0.3))
                    circle.fill.solid()
                    circle.fill.fore_color.rgb = colors["accent"]
                    circle.line.fill.background()
                    
                    # Step contents (above or below line alternatively for organic flow)
                    is_above = idx % 2 == 0
                    box_top = line_top - Inches(1.1) if is_above else line_top + Inches(0.3)
                    
                    box = slide.shapes.add_textbox(step_left + Inches(0.1), box_top, step_w - Inches(0.2), Inches(1.0))
                    tf = box.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = 0
                    
                    p_title = tf.paragraphs[0]
                    p_title.alignment = PP_ALIGN.CENTER
                    p_title.text = step.get("step_title", "")
                    p_title.font.name = colors["font_title"]
                    p_title.font.size = Pt(15)
                    p_title.font.bold = True
                    p_title.font.color.rgb = colors["primary_text"]
                    p_title.space_after = Pt(4)
                    
                    p_desc = tf.add_paragraph()
                    p_desc.alignment = PP_ALIGN.CENTER
                    p_desc.text = step.get("step_desc", "")
                    p_desc.font.name = colors["font_body"]
                    p_desc.font.size = Pt(12)
                    p_desc.font.color.rgb = colors["secondary_text"]
                    
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
        elif slide_type == "team_grid":
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            members = item.get("team_members", [])
            if not members:
                bullets = item.get("bullets", [])
                members = [{"name": bullet.split("-")[0].strip() if "-" in bullet else f"Member {idx+1}", 
                            "role": "Lead Architect" if idx == 0 else "Specialist", 
                            "bio": bullet.split("-")[1].strip() if "-" in bullet else bullet} for idx, bullet in enumerate(bullets[:3])]
                
            if is_vertical:
                # Stack profile cards vertically
                card_h = Inches(1.8)
                spacing = Inches(0.2)
                for idx, member in enumerate(members[:3]):
                    card_top = content_top + idx * (card_h + spacing)
                    
                    # Rounded card
                    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, margin_left, card_top, content_width, card_h)
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = colors["bg_light"]
                    shape.line.color.rgb = colors["accent_light"]
                    shape.line.width = Pt(1)
                    
                    tf = shape.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = Inches(0.15)
                    
                    p_name = tf.paragraphs[0]
                    p_name.text = member.get("name", "")
                    p_name.font.name = colors["font_title"]
                    p_name.font.size = Pt(15)
                    p_name.font.bold = True
                    p_name.font.color.rgb = colors["primary_text"]
                    p_name.space_after = Pt(2)
                    
                    p_role = tf.add_paragraph()
                    p_role.text = member.get("role", "")
                    p_role.font.name = colors["font_body"]
                    p_role.font.size = Pt(12)
                    p_role.font.bold = True
                    p_role.font.color.rgb = colors["accent"]
                    p_role.space_after = Pt(4)
                    
                    p_bio = tf.add_paragraph()
                    p_bio.text = member.get("bio", "")
                    p_bio.font.name = colors["font_body"]
                    p_bio.font.size = Pt(11)
                    p_bio.font.color.rgb = colors["secondary_text"]
            else:
                # Horizontal profile cards
                num_members = min(len(members), 3)
                card_w = (content_width - Inches(0.8)) / num_members
                spacing = Inches(0.4)
                for idx, member in enumerate(members[:num_members]):
                    card_left = margin_left + idx * (card_w + spacing)
                    
                    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, card_left, content_top, card_w, content_height - Inches(0.2))
                    shape.fill.solid()
                    shape.fill.fore_color.rgb = colors["bg_light"]
                    shape.line.color.rgb = colors["accent_light"]
                    shape.line.width = Pt(1)
                    
                    tf = shape.text_frame
                    tf.word_wrap = True
                    tf.margin_left = tf.margin_top = Inches(0.2)
                    tf.margin_right = Inches(0.2)
                    
                    p_name = tf.paragraphs[0]
                    p_name.text = member.get("name", "")
                    p_name.font.name = colors["font_title"]
                    p_name.font.size = Pt(16)
                    p_name.font.bold = True
                    p_name.font.color.rgb = colors["primary_text"]
                    p_name.space_after = Pt(4)
                    
                    p_role = tf.add_paragraph()
                    p_role.text = member.get("role", "")
                    p_role.font.name = colors["font_body"]
                    p_role.font.size = Pt(13)
                    p_role.font.bold = True
                    p_role.font.color.rgb = colors["accent"]
                    p_role.space_after = Pt(8)
                    
                    p_bio = tf.add_paragraph()
                    p_bio.text = member.get("bio", "")
                    p_bio.font.name = colors["font_body"]
                    p_bio.font.size = Pt(11)
                    p_bio.font.color.rgb = colors["secondary_text"]
                    
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
        else: # Default: title_and_content
            set_slide_background(slide, prs, colors["bg_light"])
            add_header(slide, item.get("title", ""), colors, margin_left, header_top, content_width)
            
            # Main Bullets Box
            content_box = slide.shapes.add_textbox(margin_left, content_top, content_width, content_height)
            tf = content_box.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            
            first = True
            for bullet in item.get("bullets", []):
                p = tf.paragraphs[0] if first else tf.add_paragraph()
                first = False
                p.text = f"•  {bullet}"
                p.font.name = colors["font_body"]
                p.font.size = Pt(15 if is_vertical else 16)
                p.font.color.rgb = colors["secondary_text"]
                p.space_after = Pt(14)
                
            add_takeaway_banner(slide, item.get("key_takeaway", ""), colors, margin_left, takeaway_top, content_width, takeaway_height)
            
    prs.save(output_filename_or_stream)
