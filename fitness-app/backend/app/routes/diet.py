from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from app.services.calculator import calculate_nutrition
from app.services.nutrition_api import nutrition_service
import traceback

router = APIRouter()

# Define request model
class FoodItem(BaseModel):
    name: str
    quantity: float

class DietRequest(BaseModel):
    items: List[FoodItem]

@router.post("/calculate")
async def calculate_diet(request: DietRequest):
    """
    Calculate nutrition for food items
    """
    try:
        print(f"📥 Received: {request.items}")
        
        # Convert to dict
        items = [{"name": item.name, "quantity": item.quantity} for item in request.items]
        
        # Calculate
        result = await calculate_nutrition(items)
        
        return {
            "status": "success",
            "total": {
                "calories": result["calories"],
                "protein": result["protein"],
                "carbs": result["carbs"],
                "fat": result["fat"]
            },
            "items": result["items"]
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@router.get("/search/{food_name}")
async def search_food(food_name: str):
    """Search for any food"""
    try:
        results = await nutrition_service.search_foods(food_name)
        return {
            "status": "success",
            "query": food_name,
            "results": results[:5] if results else []
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
