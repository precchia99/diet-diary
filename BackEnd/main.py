from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr
from database import CreateMeal, User, mealTable, engine
from sqlmodel import Session, select, func
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

@app.get("/users")
def get_user(email: EmailStr) -> User | None:
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        results = session.exec(statement).all()
        if len(results) > 0:
            return results[0]
        else:
            return None
    
@app.post("/users")
def create_user(user_data: User) -> None:
    try:
        with Session(engine) as session:
            session.add(user_data)
            session.commit()
    except:
        raise HTTPException(status_code=400)
    
@app.get("/meals/{user_id}")
def get_meal(user_id: int) -> list[mealTable] | None:
    with Session(engine) as session:
        statement = select(mealTable).where(mealTable.user_id == user_id).order_by(mealTable.meal_date)
        results = session.exec(statement).all()
        if len(results) > 0:
            return results
        else:
            raise HTTPException(status_code=400)

@app.get("/meal")
def get_meal(id: int) -> mealTable | None:
    with Session(engine) as session:
        statement = select(mealTable).where(mealTable.food_id == id)
        results = session.exec(statement).all()
        if len(results) > 0:
            return results[0]
        else:
            raise HTTPException(status_code=418)

# https://sqlmodel.tiangolo.com/tutorial/fastapi/delete/        
@app.delete("/meal/{food_id}")
def delete_meal(food_id: int):
    with Session(engine) as session:
        meal = session.get(mealTable, food_id)
        if not meal:
            raise HTTPException(status_code=404, detail="Meal not found")
        session.delete(meal)
        session.commit()

@app.post("/meal")
def create_meal(meal: CreateMeal) -> None:
    # https://spoonacular.com/food-api/docs#Guess-Nutrition-by-Dish-Name
    response = requests.get("https://api.spoonacular.com/recipes/guessNutrition?title="+meal.title+"&apiKey=bffdcc782e964b9880e7f436435f2ff6")
    if response.status_code == 200:
        response = response.json()
        if "status" in response:
            if response["status"] == "error":
                raise HTTPException(status_code=400)
        else:
            meal_data = mealTable()
            meal_data.name = meal.title
            meal_data.meal_date = datetime.strptime(meal.meal_date, "%Y-%m-%dT%H:%M")
            meal_data.meal_type = meal.meal_type
            meal_data.user_id = meal.user_id
            meal_data.calories = response["calories"]["value"]
            meal_data.carbs = response["carbs"]["value"]
            meal_data.fat = response["fat"]["value"]
            meal_data.protein = response["protein"]["value"]

            try:
                with Session(engine) as session:
                    session.add(meal_data)
                    session.commit()
            except:
                raise HTTPException(status_code=400)
    else:
        raise HTTPException(status_code=400)

@app.get("/total/{user_id}")
def get_goaltotals(user_id: int) -> list[float] | None:
    with Session(engine) as session:
        statement = select(func.sum(mealTable.calories), func.sum(mealTable.fat), func.sum(mealTable.protein), func.sum(mealTable.carbs)).where(mealTable.user_id == user_id)
        results = session.exec(statement).all()
        if len(results) > 0:
            return results[0]
        else:
            raise HTTPException(status_code=400)

@app.get("/goal/{user_id}")
def get_desiredgoal(user_id: int) -> list[float] | None:
    with Session(engine) as session:
        statement = select(User.calorie_goal, User.fat_goal, User.protein_goal, User.carb_goal).where(User.id == user_id)
        results = session.exec(statement).all()
        if len(results) > 0:
            return results[0]
        else:
            raise HTTPException(status_code=400)

@app.put("/goal/{user_id}")
def update_goals(user_id: int, goals: dict) -> User:
    with Session(engine) as session:
        statement = select(User).where(User.id == user_id)
        results = session.exec(statement).first()
        if results:
            results.calorie_goal = goals.get('calorie_goal', results.calorie_goal)
            results.fat_goal = goals.get('fat_goal', results.fat_goal)
            results.protein_goal = goals.get('protein_goal', results.protein_goal)
            results.carb_goal = goals.get('carb_goal', results.carb_goal)
            session.commit()
            return results
        else:
            raise HTTPException(status_code=400)