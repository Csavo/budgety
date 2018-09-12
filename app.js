// BUDGET CONTROLLER MODULE
var budgetController = (function() {
    
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };
    
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };
    
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(current) {
            sum += current.value;
        });
        data.totals[type] = sum;
    };
    
    var data = {
        allItems: {
            inc: [],
            exp: []
        },
        totals: {
            inc: 0,
            exp: 0
        },
        budget: 0,
        percentage: -1
    };
    
    return {
        addItem: function(type, description, value) {
            var id, newItem;
            
            // Create new ID (should be last ID + 1)
            if (data.allItems[type].length > 0) {
                id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                id = 0;
            }
            
            // Create new item based on 'inc' or 'exp' type
            if (type === 'inc') {
                newItem = new Income(id, description, value);
            } else if (type === 'exp') {
                newItem = new Expense(id, description, value);
            }
            
            // Push new item into our data structure
            data.allItems[type].push(newItem);
            
            // Return the item, so the other modules have access to the item's data
            return newItem;
        },
        
        deleteItem: function(type, id) {
            var ids, index;
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });
            index = ids.indexOf(id);
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },
        
        calculateBudget: function() {
            
            // Calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');
            
            // Calculate the Budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            
            // Calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
            
        },
        
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },
        
        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });
            return allPercentages;
        },
        
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        
        test_getItems: function() {
            console.log(data);
        }
    };

})();

// UI CONTROLLER MODULE
var uiController = (function() {
    
    // Make an object that stores different DOM element's class and/or ID names (strings)
    var domStrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeContainer: '.income__list',
        expansesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercentageLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
        incomeTitle: '.income__title',
        expensesTitle: '.expenses__title'
    };
    
    var formatNumber = function(num, type) {
        /*
        exp of 1310.4567   -> - 1,310.46
        inc of 2000        -> + 2,000
        */
        var numSplit, int, dec;
        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split('.');
        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }
        dec = numSplit[1];
        if (int === '0' && dec === '00') {
            return '0';
        } else if (dec === '00') {
            return (type === 'exp' ? '- ' : '+ ') + int;
        } else {
            return (type === 'exp' ? '- ' : '+ ') + int + '.' + dec;
        }
    };
    
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };
    
    return {
        // Read input field values, store them in an object, and share it with other modules
        getInput: function() {
            return {
                type: document.querySelector(domStrings.inputType).value, // result is eighter 'inc' or 'exp' (because in HTML <option value="inc"> and <option value="exp">)
                description: document.querySelector(domStrings.inputDescription).value,
                value: parseFloat(document.querySelector(domStrings.inputValue).value)
            };
        },
        
        addListItem: function(obj, type) {
            var domElement, htmlTemplate, htmlString;
            
            // Create HTML string with placeholder text
            if (type === 'inc') {
                domElement = domStrings.incomeContainer;
                htmlTemplate = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                domElement = domStrings.expansesContainer;
                htmlTemplate = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            
            // Replace placeholder text with actual data
            htmlString = htmlTemplate.replace('%id%', obj.id);
            htmlString = htmlString.replace('%description%', obj.description);
            htmlString = htmlString.replace('%value%', formatNumber(obj.value, type));
            
            // Insert the HTML into the DOM
            document.querySelector(domElement).insertAdjacentHTML('beforeend', htmlString);
        },
        
        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },
        
        clearFields: function() {
            var fields, fieldsArray;
            fields = document.querySelectorAll(domStrings.inputDescription + ', ' + domStrings.inputValue);
            fieldsArray = Array.prototype.slice.call(fields);
            fieldsArray.forEach(function(current, index, array) {
                current.value = "";
            });
            fieldsArray[0].focus();
        },
        
        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(domStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(domStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(domStrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');
            if (obj.percentage > 0) {
                document.querySelector(domStrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(domStrings.percentageLabel).textContent = 'N/A';
            }
        },
        
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(domStrings.expensesPercentageLabel);
            
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = 'N/A';
                }
            });
        },
        
        displayDate: function() {
            var now, months, month, year;
            now = new Date();
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            
            document.querySelector(domStrings.dateLabel).textContent = months[month] + ', ' + year;
        },
        
        changedType: function() {
            var fields = document.querySelectorAll(
                domStrings.inputType + ',' + 
                domStrings.inputDescription + ',' + 
                domStrings.inputValue);
            
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });
            
            document.querySelector(domStrings.inputButton).classList.toggle('red');
        },
        
        toggleTitles: function(obj) {
            if (obj.totalInc === 0) {
                document.querySelector(domStrings.incomeTitle).style.display = 'none';
            } else {
                document.querySelector(domStrings.incomeTitle).style.display = 'block';
            }
            if (obj.totalExp === 0) {
                document.querySelector(domStrings.expensesTitle).style.display = 'none';
            } else {
                document.querySelector(domStrings.expensesTitle).style.display = 'block';
            }
        },
        
        // Share the domStrings object with other modules
        getDomStrings: function() {
            return domStrings;
        }
    };
    
})();

// GLOBAL APP CONTROLLER MODULE
var controller = (function(budgetCtrl, uiCtrl) {
    
    var setUpEventListeners = function() {
        var domStrings = uiCtrl.getDomStrings();
        
        // Add event listener to the button
        document.querySelector(domStrings.inputButton).addEventListener('click', ctrlAddItem);
        
        // Add event listener for keypress to the whole document
        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        
        // Add event listener for the delete buttons in both Encome and Expense lists
        document.querySelector(domStrings.container).addEventListener('click', ctrlDeleteItem);
        
        // Add event listener for the inc/exp selector
        document.querySelector(domStrings.inputType).addEventListener('change', uiCtrl.changedType);
    };
    
    var updateBudget = function() {
        
        // Calculate Budget
        budgetController.calculateBudget();
        
        // Return Budget
        var budget = budgetCtrl.getBudget();
        
        // Display the budget on the UI
        uiCtrl.displayBudget(budget);
        //console.log(budget);
    };
    
    var updatePercentages = function() {
        
        // Calculate Percentages
        budgetCtrl.calculatePercentages();
        
        // Read
        var percentages = budgetCtrl.getPercentages();
        
        // Update UI with percentages
        uiCtrl.displayPercentages(percentages);
    };
    
    var ctrlAddItem = function() {
        var input, newItem;
        
        // Get the field input data
        input = uiCtrl.getInput();
        //console.log(input);
        
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            
            // Add the item to the budget controller
            newItem = budgetController.addItem(input.type, input.description, input.value);
            
            // Add the item to the UI
            uiCtrl.addListItem(newItem, input.type);
            
            // Clear the input fields
            uiCtrl.clearFields();
            
            // Calculate and update Budget
            updateBudget();
            
            // Calculate and update percentages
            updatePercentages();
            
            // Toggle titles
            uiCtrl.toggleTitles(budgetCtrl.getBudget());
        }
    };
    
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, id;
        
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            id = parseInt(splitID[1], 10);
        }
        
        if (id >= 0) {
            // Delete the item from the data structure
            budgetCtrl.deleteItem(type, id);
            
            // Delete the item from the UI
            uiCtrl.deleteListItem(itemID);
        
            // Update new Budget
            updateBudget();
        
            // Calculate and update percentages
            updatePercentages();
            
            // Toggle titles
            uiCtrl.toggleTitles(budgetCtrl.getBudget());
        }
    };
    
    return {
        init: function() {
            setUpEventListeners();
            uiCtrl.displayDate();
            uiCtrl.toggleTitles(budgetCtrl.getBudget());
            uiCtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            console.log('Application started!');
        }
    };
    
})(budgetController, uiController);

controller.init();
