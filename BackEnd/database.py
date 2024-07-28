from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel, create_engine
import datetime

DB_FILE = 'db.sqlite3'
engine = create_engine(f"sqlite:///{DB_FILE}", echo=True)

class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    calorie_goal: int = Field(default=2000)
    fat_goal: int = Field(default=78)
    protein_goal: int = Field(default=50)
    carb_goal: int = Field(default=275)
    email: str = Field(sa_column_kwargs={"unique": True})

class mealTable(SQLModel, table=True):
    food_id: int = Field(default=None, primary_key=True)
    user_id: int = Field(default=None, foreign_key="user.id")
    name: str
    meal_date: datetime.datetime
    meal_type: str
    calories: float
    carbs: float
    fat: float
    protein: float

class CreateMeal(BaseModel):
    user_id: int
    title: str
    meal_date: str
    meal_type: str

def create_tables():
    """Create the tables registered with SQLModel.metadata (i.e classes with table=True).
    More info: https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/#sqlmodel-metadata
    """
    SQLModel.metadata.create_all(engine)

if __name__ == '__main__':
    # creates the table if this file is run independently, as a script
    create_tables()
