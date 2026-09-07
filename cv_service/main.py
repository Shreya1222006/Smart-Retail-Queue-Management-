from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import zxingcpp

app = FastAPI(
    title="Smart Retail Computer Vision API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading YOLOv8 model...")
model = YOLO("yolov8n.pt")
print("YOLOv8 model loaded!")


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Smart Retail CV Engine",
        "model": "YOLOv8n"
    }


@app.post("/detect")
async def detect_frame(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # --- 1. INDUSTRIAL BARCODE / QR SCANNING (zxing-cpp) ---
        barcodes_found = []
        results_zxing = zxingcpp.read_barcodes(frame)
        for b in results_zxing:
            barcodes_found.append({
                "code": b.text,
                "type": str(b.format)
            })

        # --- 2. OBJECT DETECTION (YOLOv8) ---
        results = model(frame, verbose=False)
        detected_objects = []

        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                label = model.names[cls_id]

                if conf >= 0.35:
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                    detected_objects.append({
                        "label": label,
                        "confidence": round(conf * 100, 1),
                        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
                    })

        return {
            "success": True,
            "barcodes": barcodes_found,
            "detectedObjects": detected_objects,
            "totalItemsCount": len(detected_objects)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))