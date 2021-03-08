const mysql = require('mysql');
const inquirer = require('inquirer');
const config = require('./config/config.json');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');


// Compare login credentials to stored config file.
const compareHash = (username, password) => {
    bcrypt.compare(username, config.username, (err, result) => {
        if (!result) {
            console.log("Bad username.");
            process.exit(1);
        }});
    bcrypt.compare(password, config.password, (err, result) => {
        if (!result) {
            console.log("Bad password.");
            process.exit(1);
        }});
}

// Login
const access = async () => {
    return await inquirer
        .prompt([
            {
                type: 'input',
                name: 'username',
                message: 'What is your mySQL username?'
            },
            {
                type: 'password',
                name: 'password',
                message: 'What is your mySQL password?'
            }
        ]).then((answer) => {
                compareHash(answer.username, answer.password)
                return answer;
            })
};

access().then((credentials) => {
        const connection = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: credentials.username,
            password: credentials.password,
            database: 'employee-database',
        });

        connection.connect((err) => {
            if (err) throw err;
            console.log("connection to database successful.\n");
            generalMenu();
        });

        const viewDB = (param) => {
                let query = `SELECT * FROM ${param}`;
                connection.query(query, (err, res) => {
                    if (!res[0] === false) {
                        let columnMap = Object.keys(res[0]).filter((ele) => ele.substring(0,3) === "id_");
                        columnMap = columnMap.map((ele) => ele.split("_")[1]);
                        columnMap.forEach((ele) => {
                            query = `${query} LEFT JOIN ${ele} ON ${param}.id_${ele} = ${ele}.id`
                        })
                        connection.query(query, (err, res) => {
                            res.forEach((ele) => {
                                Object.entries(ele).forEach((entry) => {
                                    if (entry[0].substring(0,2) === "id") delete ele[entry[0]];
                                })
                            });
                            console.table(res);
                            generalMenu();
                        })
                    }
            });
        };

        const addDB = (param) => {
            switch(param) {
                case `Employee`:
                    let query = `SELECT * FROM ${param}`;
                    connection.query(query, (err, res) => {})
                break;
                case `Role`:
                break;
                case `Department`:
                break;
            }
            
        }

        const removeDB = (param) => {
            switch(param) {
                case `Employee`:
                break;
                case `Role`:
                break;
                case `Department`:
                break;
            }
            
        }

        const selectionRouting = (answer) => {
            const split = answer.selection.split(" ");

            switch(split[0]) {
                case `View`:
                    viewDB(split[1]);
                break;
                case `Add`:
                    addDB(split[1]);
                break;
                case `Remove`:
                    removeDB(split[1]);
                break;
            }
        } 

        // General Menu
        const generalMenu = () => {
            console.log(`Welcome to Ryan's Employee Database!`)
            inquirer
                .prompt({
                    pageSize: 22
                    ,
                    name: 'selection',
                    type: 'rawlist',
                    message: 'What would you like to do?',
                    choices: [
                        new inquirer.Separator(`\n==== Employees ====`),
                        'View Employee',
                        'Add Employee',
                        'Remove Employee',
                        'Change Role',
                        'Assign to Manager',
                        new inquirer.Separator(`--------`),
                        'Make Employee a Manager',
                        'Remove Manager Status',
                        new inquirer.Separator(`\n==== Roles ====`),
                        'View Role',
                        'Add Role',
                        'Remove Role',
                        new inquirer.Separator(`\n==== Departments ====`),
                        'View Department',
                        'Add Department',
                        'Remove Department',
                        // new inquirer.Separator(`---- Other ----`),
                        // 'View Utilized Budget'
                    ]}).then((answer) => {
                        selectionRouting(answer);
                    });
        }
})

