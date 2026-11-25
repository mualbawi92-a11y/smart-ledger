import os
from PIL import Image, ImageDraw, ImageFont

def generate_smart_ledger_icon():
    os.makedirs('assets', exist_ok=True)
    size = (512, 512)
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background Rounded Rectangle
    # Navy/Slate gradient simulation with layered rounded rects
    # Outer dark border
    draw.rounded_rectangle([16, 16, 496, 496], radius=110, fill=(15, 23, 42, 255), outline=(16, 185, 129, 255), width=8)
    # Inner subtle glow
    draw.rounded_rectangle([28, 28, 484, 484], radius=98, outline=(51, 65, 85, 180), width=3)

    # 2. Ledger Book Folio
    # Book Cover (Deep Teal)
    draw.rounded_rectangle([90, 80, 410, 420], radius=24, fill=(13, 148, 136, 255), outline=(15, 118, 110, 255), width=4)
    # Main Page (Crisp Paper)
    draw.rounded_rectangle([120, 96, 395, 404], radius=16, fill=(248, 250, 252, 255))
    
    # Spine stitching
    for y in range(110, 390, 20):
        draw.line([(150, y), (150, y + 10)], fill=(148, 163, 184, 255), width=3)

    # Emerald Header Bar
    draw.rounded_rectangle([165, 120, 375, 150], radius=8, fill=(16, 185, 129, 255))

    # Accounting Row 1 (Credit - Green)
    draw.rounded_rectangle([165, 175, 290, 192], radius=6, fill=(203, 213, 225, 255))
    draw.rounded_rectangle([305, 175, 375, 192], radius=6, fill=(16, 185, 129, 255))

    # Accounting Row 2 (Debit - Red)
    draw.rounded_rectangle([165, 210, 270, 227], radius=6, fill=(203, 213, 225, 255))
    draw.rounded_rectangle([285, 210, 375, 227], radius=6, fill=(239, 68, 68, 255))

    # Accounting Row 3 (Credit - Green)
    draw.rounded_rectangle([165, 245, 300, 262], radius=6, fill=(203, 213, 225, 255))
    draw.rounded_rectangle([315, 245, 375, 262], radius=6, fill=(16, 185, 129, 255))

    # Growth Trend Line (Emerald)
    points = [(165, 350), (225, 320), (280, 335), (365, 275)]
    draw.line(points, fill=(5, 150, 105, 255), width=8)
    # Arrow head
    draw.polygon([(365, 275), (345, 275), (365, 295)], fill=(5, 150, 105, 255))

    # Gold Ribbon Bookmark
    ribbon = [(200, 80), (200, 160), (215, 145), (230, 160), (230, 80)]
    draw.polygon(ribbon, fill=(245, 158, 11, 255), outline=(217, 119, 6, 255))

    # 3. Gold Balance Coin (Bottom Right)
    draw.ellipse([320, 315, 450, 445], fill=(245, 158, 11, 255), outline=(254, 240, 138, 255), width=6)
    draw.ellipse([335, 330, 435, 430], outline=(217, 119, 6, 255), width=3)
    
    # Currency Glyph in Coin
    # Draw stylized currency symbol
    draw.line([(385, 345), (385, 415)], fill=(120, 53, 15, 255), width=6)
    draw.arc([365, 355, 405, 385], start=90, end=270, fill=(120, 53, 15, 255), width=6)
    draw.arc([365, 375, 405, 405], start=270, end=90, fill=(120, 53, 15, 255), width=6)

    # Save high-res PNG
    img.save('assets/icon.png', 'PNG')
    
    # Save Windows multi-resolution ICO (256, 128, 64, 48, 32, 16)
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save('assets/icon.ico', format='ICO', sizes=icon_sizes)
    print("Icon generated successfully: assets/icon.ico and assets/icon.png")

if __name__ == '__main__':
    generate_smart_ledger_icon()
