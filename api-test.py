import requests
import json

print("API Key:")
api_key = input()

print("Recipe ID:")
recipe = input()

response = requests.get(f'https://api.spoonacular.com/recipes/{recipe}/information?apiKey={api_key}&includeNutrition=true')
data = json.loads(response.content)
data