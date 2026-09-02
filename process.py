import cv2
from rembg import remove
from PIL import Image
import os

image_path = "assets/drivers/car_drivers.jpg"
out_dir = "assets/drivers/extracted"
os.makedirs(out_dir, exist_ok=True)

names = ["Nina", "Paul", "Helina", "Gaurav", "Vibhore", "Alex", "Mathew", "Jasmine", "Rahul"]

img = cv2.imread(image_path)
h, w, _ = img.shape

cell_h = h // 3
cell_w = w // 3

idx = 0
for row in range(3):
    for col in range(3):
        if idx >= len(names):
            break
            
        y1 = row * cell_h
        y2 = (row + 1) * cell_h
        x1 = col * cell_w
        x2 = (col + 1) * cell_w
        
        # Crop the cell
        cell_img = img[y1:y2, x1:x2]
        
        # Crop a little bit more to center the face, if necessary
        # We can just leave it to rembg to remove the background
        cell_rgb = cv2.cvtColor(cell_img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(cell_rgb)
        
        # Use u2net_human_seg for better human segmentation (keeps hats/hair)
        # Alpha matting helps with hair details
        from rembg import new_session
        my_session = new_session("u2net_human_seg")
        out_img = remove(
            pil_img, 
            session=my_session, 
            alpha_matting=True, 
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )
        
        out_path = os.path.join(out_dir, f"{names[idx]}.png")
        out_img.save(out_path)
        print(f"Saved {out_path}")
        idx += 1
