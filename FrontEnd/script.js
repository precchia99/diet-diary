async function getUser() {
    const username = document.querySelector("#Username").value;
    const response = await fetch(`http://localhost:8000/users?email=${username}`);

    if (response.status === 200) {
        const user = await response.json();
        if (user != null) {
            sessionStorage.setItem('userData', JSON.stringify(user));
            window.location.href = "./meal-tracker.html";
        }
        else {
            const toastEl = document.querySelector(".toast");
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
            toastBootstrap.show();
        }
    }
    else {
        const toastEl = document.querySelector(".toast");
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
        toastBootstrap.show();
    }
}

async function addUser(event) {
    event.preventDefault();
    const user = {
        "first_name": document.querySelector("#firstName").value,
        "last_name": document.querySelector("#lastName").value,
        "email": document.querySelector("#email").value
    };

    const response = await fetch("http://localhost:8000/users", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    var resp = await response.json();
    if (response.status === 200) {
        const res = await fetch(`http://localhost:8000/users?email=${user.email}`);
        if (response.status === 200) {
            const user = await res.json();
            if (user != null) {
                sessionStorage.setItem('userData', JSON.stringify(user));
                window.location.href = "./meal-tracker.html";
            }
            else {
                const toastEl = document.querySelector(".toast");
                const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
                toastBootstrap.show();
            }
        }
        else {
            const toastEl = document.querySelector(".toast");
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
            toastBootstrap.show();
        }
    }
    else if (response.status === 400) {
        const toastEl = document.querySelector(".toast");
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
        toastBootstrap.show();
    }
}

async function getMeals() {
    // convert string to json to get user id
    const user_id = JSON.parse(sessionStorage.getItem("userData"))["id"];
    // call backend to get all meals for user
    const response = await fetch(`http://localhost:8000/meals/${user_id}`);
    const meals = await response.json();

    const tableBody = document.getElementById("mealBody");

    // create a new tr for every meal
    meals.forEach(i => {
        const newRow = document.createElement("tr");

        const idCol = document.createElement("th");
        idCol.appendChild(document.createTextNode(i.food_id));
        newRow.append(idCol);

        const dateCol = document.createElement("td");
        dateCol.appendChild(document.createTextNode(i.meal_date));
        newRow.append(dateCol);

        const titleCol = document.createElement("td");
        titleCol.appendChild(document.createTextNode(i.name));
        newRow.append(titleCol);

        const mealTypeCol = document.createElement("td");
        mealTypeCol.appendChild(document.createTextNode(i.meal_type));
        newRow.append(mealTypeCol);

        const caloriesCol = document.createElement("td");
        caloriesCol.appendChild(document.createTextNode(i.calories));
        newRow.append(caloriesCol);

        const fatsCol = document.createElement("td");
        fatsCol.appendChild(document.createTextNode(i.fat));
        newRow.append(fatsCol);

        const carbsCol = document.createElement("td");
        carbsCol.appendChild(document.createTextNode(i.carbs));
        newRow.append(carbsCol);

        const proteinCol = document.createElement("td");
        proteinCol.appendChild(document.createTextNode(i.protein));
        newRow.append(proteinCol);

        const actionCol = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.classList = ["btn btn-danger"];
        deleteBtn.type = "button";
        deleteBtn.id = i.food_id;
        deleteBtn.onclick = deleteMeal;
        deleteBtn.appendChild(document.createTextNode("Delete"));
        actionCol.append(deleteBtn);
        newRow.append(actionCol);

        tableBody.append(newRow);
    });
}

async function addMeal() {
    const meal = {
        "user_id": JSON.parse(sessionStorage.getItem("userData"))["id"],
        "title": document.querySelector("#mealDescription").value,
        "meal_date": document.querySelector("#mealDateTime").value,
        "meal_type": document.querySelector("#mealType").value
    };

    const response = await fetch("http://localhost:8000/meal", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(meal)
    });

    var resp = await response.json();
    if (response.status === 200) {
        const mealModal = document.querySelector("#addMealModal");
        var mealModalBS = bootstrap.Modal.getInstance(mealModal);
        mealModalBS.hide();
        location.reload();
    }
    else if (response.status === 400) {
        const toastEl = document.querySelector(".toast");
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
        toastBootstrap.show();
    }
}

async function deleteMeal(event) {
    var mealID = event.target.id;

    const response = await fetch("http://localhost:8000/meal/" + mealID, {
        method: "DELETE",
        mode: "cors"
    });

    if (response.status === 200) {
        location.reload();
    }
}

async function getSpoonacular() {
    const spoonid = document.querySelector("#SpoonID").valueAsNumber;
    if(isNaN(spoonid)){
        alert("Choose a number!")
        return
    }
    const response = await fetch(`http://localhost:8000/meal?id=${spoonid}`);
    const apiKey = '7e6921eb971a480385b58404f3eee02e';
    let spoonjson;

    if (response.status === 418) { //not in the database, use spoonacular instead
        const response = await fetch(`https://api.spoonacular.com/recipes/${spoonid}/information?apiKey=${apiKey}&includeNutrition=true`);
        spoonjson = await response.json();
        if (response.status === 402){
            alert("API issues!")
            return
        }
        if (response.status === 404){
            alert("Couldn't find the recipe!")
            return
        }
        //addSpoonacular(spoonjson)
    } else {
        spoonjson = await response.json();
    }
    // console.log(spoonjson);
    // shows the giant json thing

    const foodimg = document.getElementById('foodPic');
    foodimg.src = spoonjson.image; //gets image from spoonacular

    const foodInfo = document.getElementById('foodInfo');
    foodInfo.innerHTML = ''; //clears out the text, if full
    foodInfo.appendChild(document.createTextNode(spoonjson.title));
    foodInfo.appendChild(document.createElement('br')); //linebreaks
    if (spoonjson.vegetarian == true) {
        foodInfo.appendChild(document.createTextNode("This dish is vegetarian!"));
        foodInfo.appendChild(document.createElement('br')); //linebreaks
    }
    for (let nutrient of spoonjson.nutrition.nutrients) { //contains
        if (nutrient.name == "Calories") {
            foodInfo.appendChild(document.createTextNode("the calories for this are " + nutrient.amount + nutrient.unit));
            foodInfo.appendChild(document.createElement('br')); //linebreaks
        }
        if (nutrient.name == "Fat")
            fat = nutrient
        if (nutrient.name == "Trans Fat")
            transfat = nutrient
        if (nutrient.name == "Saturated Fat")
            satfat = nutrient
        if (nutrient.name == "Carbohydrates") {
            foodInfo.appendChild(document.createTextNode("the carbs for this are " + nutrient.amount + nutrient.unit));
            foodInfo.appendChild(document.createElement('br')); //linebreaks
            foodInfo.appendChild(document.createTextNode("this is your " + nutrient.percentOfDailyNeeds + "% daily value"));
            foodInfo.appendChild(document.createElement('br')); //linebreaks
        }
        if (nutrient.name == "Sugar") {
            foodInfo.appendChild(document.createTextNode("the sugars for this are " + nutrient.amount + nutrient.unit));
            foodInfo.appendChild(document.createElement('br')); //linebreaks
        }
    }
    //use the fats we stored, but didn't display
    foodInfo.appendChild(document.createTextNode("the total fats for this are " + fat.amount + fat.unit));
    foodInfo.appendChild(document.createElement('br')); //linebreaks
    //TODO: if differing units, convert them (kg, g, mg)
    if (typeof transfat != 'undefined') {
        foodInfo.appendChild(document.createTextNode("there are " + transfat.amount + transfat.unit + " trans fats, which is " + transfat.percentOfDailyNeeds + "% of your daily    needs"));
        foodInfo.appendChild(document.createElement('br')); //linebreaks
    }
    if (typeof satfat != 'undefined') {
        foodInfo.appendChild(document.createTextNode("there are " + satfat.amount + satfat.unit + " saturated fats, which is " + satfat.percentOfDailyNeeds + "% of your daily needs"));
        foodInfo.appendChild(document.createElement('br')); //linebreaks
    }
    if (typeof transfat != 'undefined' && typeof satfat != 'undefined')
        foodInfo.appendChild(document.createTextNode((transfat.amount / fat.amount) + "% of your total fat is transfats, and " + (satfat.amount / fat.amount) + "% of your total is sat fats"));
}

async function addSpoonacular(spoonjson) {
    event.preventDefault();
    let meal = {};
    meal.title = spoonjson.title;
    meal.image = spoonjson.image;
    meal.vegetarian = spoonjson.vegetarian;
    meal.nutrition = {}; //unsure

    const response = await fetch("http://localhost:8000/meal", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    var resp = await response.json();
    if (response.status === 400) {
        const toastEl = document.querySelector(".toast");
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastEl);
        toastBootstrap.show();
    }
}

async function getGoalTotals() {
    const user_id = JSON.parse(sessionStorage.getItem("userData"))["id"];
    const totalResponse = await fetch(`http://localhost:8000/total/${user_id}`);
    const totals = await totalResponse.json();
    const caloriesCanvas = document.getElementById('calories');
    const fatCanvas = document.getElementById('fat');
    const proteinCanvas = document.getElementById('protein');
    const carbsCanvas = document.getElementById('carbs');

    const goalResponse = await fetch(`http://localhost:8000/goal/${user_id}`);
    const goals = await goalResponse.json();
    const caloriesGoal = document.getElementById('caloriesGoal');
    const fatGoal = document.getElementById('fatGoal');
    const proteinGoal = document.getElementById('proteinGoal');
    const carbsGoal = document.getElementById('carbsGoal');

    drawGoal(caloriesCanvas, totals[0], goals[0], '#a4cf92', '#5da53e', 'Calories', 'kcal');
    drawGoal(fatCanvas, totals[1], goals[1],'#91adc7', '#234ca7', 'Fat', 'g');
    drawGoal(proteinCanvas, totals[2], goals[2], '#ca9c9c', '#ca3030', 'Protein', 'g');
    drawGoal(carbsCanvas, totals[3], goals[3], '#ecc393', '#ecab47', 'Carbohydrates', 'g');
    caloriesGoal.textContent = goals[0].toString();
    fatGoal.textContent = goals[1].toString();
    proteinGoal.textContent = goals[2].toString();
    carbsGoal.textContent = goals[3].toString();
}

function drawGoal(canvas, total, goal, bg, fg, label, unit) {
    const canv = canvas.getContext('2d');
    const start = -0.5 * Math.PI

    //outside
    canv.beginPath();
    canv.arc(canvas.width / 2, canvas.width / 2, canvas.width / 2 - 10, start, start + 2 * Math.PI);
    canv.strokeStyle = bg;
    canv.lineWidth = 20;
    canv.stroke();

    //inside
    canv.beginPath();
    canv.arc(canvas.width / 2, canvas.width / 2, canvas.width / 2 - 10, start, start + (total/goal) * 2 * Math.PI);
    canv.strokeStyle = fg;
    canv.lineWidth = 20;
    canv.stroke();

    //text
    canv.font = 'bold 16px Arial';
    canv.fillStyle = '#000000';
    canv.textAlign = 'center';
    canv.textBaseline = 'middle';
    canv.fillText(label, canvas.width / 2, canvas.width / 2-16);
    canv.fillText(total + ' / ' + goal + ' ' + unit, canvas.width / 2, canvas.width / 2);

    //stupid rounding
    const percent = (Math.round(total/goal * 10000) / 100).toString().replace(/(\.\d*[1-9])0+$/, "$1");
    canv.fillText(percent + '%', canvas.width / 2, canvas.width / 2+16);
}


async function updateGoals() {
    event.preventDefault();
    const user_id = JSON.parse(sessionStorage.getItem("userData"))["id"];
    const goals = {
        "calorie_goal": parseInt(document.getElementById('caloriesGoal').textContent.trim()),
        "fat_goal": parseInt(document.getElementById('fatGoal').textContent.trim()),
        "protein_goal": parseInt(document.getElementById('proteinGoal').textContent.trim()),
        "carb_goal": parseInt(document.getElementById('carbsGoal').textContent.trim())
    };

    const response = await fetch(`http://localhost:8000/goal/${user_id}`, {
        method: "PUT",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(goals)
    });

    const data = await response.json();
    console.log('goal info:', data);
    location.reload();
}