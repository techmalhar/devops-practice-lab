import httpx
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()

class NutritionAPIService:
    def __init__(self):
        # USDA API Key from .env
        self.api_key = os.getenv("USDA_API_KEY", "")
        self.base_url = "https://api.nal.usda.gov/fdc/v1"
        
        if not self.api_key:
            print("⚠️  WARNING: USDA_API_KEY not found in .env file!")
    
    async def get_nutrition(self, food_name: str, quantity: float = 100) -> Dict:
        """
        Get nutrition data for ANY food using USDA API
        Returns: {calories, protein, carbs, fat, source}
        """
        
        food_name = food_name.lower().strip()
        
        # Search USDA database
        try:
            food_data = await self._search_usda_food(food_name)
            if food_data:
                multiplier = quantity / 100
                return {
                    "calories": round(food_data["calories"] * multiplier, 1),
                    "protein": round(food_data["protein"] * multiplier, 1),
                    "carbs": round(food_data["carbs"] * multiplier, 1),
                    "fat": round(food_data["fat"] * multiplier, 1),
                    "source": f"USDA: {food_data['name'][:50]}"
                }
        except Exception as e:
            print(f"USDA API Error: {e}")
        
        # If API fails, return estimated values
        return self._estimate_nutrition(food_name, quantity)
    
    async def _search_usda_food(self, query: str) -> Optional[Dict]:
        """
        Search USDA database and return first match with nutrition data
        """
        
        if not self.api_key:
            return None
        
        url = f"{self.base_url}/foods/search"
        params = {
            "api_key": self.api_key,
            "query": query,
            "pageSize": 1,
            "dataType": ["Foundation", "Survey (FNDDS)", "Branded"]
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            if not data.get("foods"):
                return None
            
            food = data["foods"][0]
            
            # Extract nutrients
            nutrients = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0
            }
            
            for nutrient in food.get("foodNutrients", []):
                nutrient_name = nutrient.get("nutrientName", "").lower()
                value = nutrient.get("value", 0)
                
                if "energy" in nutrient_name and "kcal" in nutrient_name:
                    nutrients["calories"] = value
                elif "protein" in nutrient_name and "total" not in nutrient_name:
                    nutrients["protein"] = value
                elif "carbohydrate" in nutrient_name and "total" in nutrient_name:
                    nutrients["carbs"] = value
                elif "total lipid" in nutrient_name:
                    nutrients["fat"] = value
            
            return {
                "name": food.get("description", query),
                "calories": nutrients["calories"],
                "protein": nutrients["protein"],
                "carbs": nutrients["carbs"],
                "fat": nutrients["fat"]
            }
    
    async def search_foods(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Search for foods and return list of matches
        """
        
        if not self.api_key:
            return []
        
        url = f"{self.base_url}/foods/search"
        params = {
            "api_key": self.api_key,
            "query": query,
            "pageSize": limit
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            results = []
            
            for food in data.get("foods", []):
                results.append({
                    "name": food.get("description", ""),
                    "brand": food.get("brandOwner", "USDA"),
                    "fdc_id": food.get("fdcId")
                })
            
            return results
    
    def _estimate_nutrition(self, food_name: str, quantity: float) -> Dict:
        """
        Fallback: Estimate nutrition based on food category
        """
        
        food_name = food_name.lower()
        
        # Smart category detection
        if any(word in food_name for word in ["apple", "banana", "mango", "orange", "grape", "berry", "fruit"]):
            calories_per_100g = 60
            protein = 0.8
            carbs = 15
            fat = 0.3
        elif any(word in food_name for word in ["broccoli", "spinach", "carrot", "potato", "tomato", "vegetable", "veg"]):
            calories_per_100g = 45
            protein = 2
            carbs = 8
            fat = 0.2
        elif any(word in food_name for word in ["chicken", "fish", "meat", "paneer", "tofu", "egg", "protein"]):
            calories_per_100g = 150
            protein = 20
            carbs = 2
            fat = 7
        elif any(word in food_name for word in ["rice", "wheat", "bread", "roti", "noodle", "pasta", "grain"]):
            calories_per_100g = 120
            protein = 4
            carbs = 25
            fat = 1
        elif any(word in food_name for word in ["milk", "curd", "yogurt", "cheese", "dairy"]):
            calories_per_100g = 100
            protein = 8
            carbs = 10
            fat = 5
        else:
            # Default average
            calories_per_100g = 100
            protein = 5
            carbs = 12
            fat = 4
        
        multiplier = quantity / 100
        
        return {
            "calories": round(calories_per_100g * multiplier, 1),
            "protein": round(protein * multiplier, 1),
            "carbs": round(carbs * multiplier, 1),
            "fat": round(fat * multiplier, 1),
            "source": "Estimated (USDA API not available)"
        }


# Create a single instance
nutrition_service = NutritionAPIService()
