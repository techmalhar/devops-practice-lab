from pydantic import BaseModel
from typing import List

class FoodItem(BaseModel):
    name: str
    quantity: int

class DietRequest(BaseModel):
    items: List[FoodItem]
