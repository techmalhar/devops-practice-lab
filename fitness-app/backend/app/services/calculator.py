from typing import List, Dict
from app.database import get_connection
from app.services.nutrition_api import nutrition_service

async def calculate_nutrition(items: List[Dict]) -> Dict:
    """
    Calculate total nutrition for list of food items
    Uses USDA API for real data
    """
    
    total = {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "items": []
    }
    
    conn = get_connection()
    cursor = conn.cursor()
    
    for item in items:
        name = item["name"].strip()
        quantity = float(item["quantity"])
        
        # Get nutrition from USDA API
        nutrition = await nutrition_service.get_nutrition(name, quantity)
        
        # Add to total
        total["calories"] += nutrition["calories"]
        total["protein"] += nutrition["protein"]
        total["carbs"] += nutrition["carbs"]
        total["fat"] += nutrition["fat"]
        
        # Store item details
        item_data = {
            "name": name,
            "quantity": quantity,
            "calories": nutrition["calories"],
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fat": nutrition["fat"],
            "source": nutrition.get("source", "Unknown")
        }
        total["items"].append(item_data)
        
        # Save to database
        try:
            query = """
            INSERT INTO diet_logs (food_name, quantity, calories, protein, carbs, fat, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                name, quantity,
                nutrition["calories"],
                nutrition["protein"],
                nutrition["carbs"],
                nutrition["fat"],
                nutrition.get("source", "Unknown")
            )
            cursor.execute(query, values)
        except Exception as e:
            print(f"Database error: {e}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return total
