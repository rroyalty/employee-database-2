const mysql = require('mysql');
const inquirer = require('inquirer');
const config = require('./config/config.json');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const templates = require('./templates/templates');

// Compare login credentials to stored config file.
const compareHash = (param, hash) => {
    bcrypt.compare(hash, config[param], (err, result) => {
        if (!result) {
            console.log(`Bad ${param}.`);
            process.exit(0);
}})}


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
                return answer;
            })
};

access().then((credentials) => {
    compareHash(`username`, credentials.username);
    compareHash(`password`, credentials.password);

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
        let query = templates.View[param];
        connection.query(query, (err, res) => {
            console.table(res);
            generalMenu();
        })
    }

    const addDBSetUp = (param) => {
        const paramList = [];
        switch(param) {
            case `Employee`:
                connection.query(`SELECT Role FROM role`, ((err, res) => {
                    res.forEach((ele) => paramList.push(`${ele.Role}`));
                    addDB(param, paramList);
                }))
            break;
            case `Role`:
                connection.query(`SELECT Department FROM department`, ((err, res) => {
                    res.forEach((ele) => paramList.push(`${ele.Department}`));
                    addDB(param, paramList);
                }))
            break;
            default:
                addDB(param, [])
        }
    }

    const addDB = (param, list) => {
        if (list !== undefined && list.length > 0) templates.QuestionList[param][0].choices = list;
        inquirer.prompt(templates.QuestionList[param]).then((answer) => {
            const firstKey = Object.keys(answer)[0].split("_")
            if ( firstKey[0] === "id" ) {
                connection.query(`SELECT id FROM ${firstKey[1]} WHERE ${firstKey[1]} = ?`, Object.values(answer)[0], (err, res) => {
                    answer[Object.keys(answer)[0]] = res[0].id;
                    connection.query(`INSERT INTO ${param} SET ?`, answer, (err, res) => { 
                        console.log(`Entry Added!\n`)
                        generalMenu();
                    })
                })
            } else {
                connection.query(`INSERT INTO ${param} SET ?`, answer, (err, res) => { 
                    console.log(`Entry Added!\n`)
                    generalMenu();
                })
            }
        })
    }

    const removeDB = (param) => {
        let select = param;
        switch (param) {
            case 'Employee':
                select = `CONCAT(first_name, " " , last_name)`;
            break;
        }
        connection.query(`SELECT ${select} AS ${param} FROM ${param}`, (err, res) => {
            const columnMap = res.map((ele) => ele[param]);
            console.log(`==================================================================\nBe Careful! Deleting entries will cascade to related tables!!\n(Department => Roles => Employees)\n==================================================================\n`);
            inquirer
                .prompt({
                    pageSize: 5,
                    name: 'selection',
                    type: 'list',
                    message: 'Which entry would you like to delete?',
                    choices: columnMap
                }).then((answer) => {
                    connection.query(`DELETE FROM ${param} WHERE ${select} = ?`, answer.selection, (err, res) => {
                        console.log(`Entry Deleted!\n`)
                        generalMenu();
                    });
                })
        })
    }

    const changeRole = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM employee`, (err, res) => {
            const employeeMap = res.map((ele) => ele.Employee);
            inquirer
                .prompt({
                    pageSize: 5,
                    name: 'name',
                    type: 'list',
                    message: 'Which employee is changing roles?',
                    choices: employeeMap
                }).then((answer) => {
                    const employee = answer.name;
                    connection.query(`SELECT Role fROM role`, (err, res) => {
                        const roleMap = res.map((ele) => ele.Role);
                        inquirer
                            .prompt({
                                pageSize: 5,
                                name: 'role',
                                type: 'list',
                                message: `Whose role would you like to change ${employee} to?`,
                                choices: roleMap
                            }).then((answer) => {
                                const role = answer.role;
                                connection.query(`SELECT id fROM role WHERE Role = ?`, role, (err, res) => {
                                    const roleID = res[0].id;
                                    connection.query(`UPDATE Employee SET id_role = ? WHERE CONCAT(first_name, " " , last_name) = ?`, [roleID, employee], (err, res) => {
                                        console.log(`Role updated!\n`);
                                        generalMenu();
                                    })
                                })
                            })
                    })
                })
        })
    }

    const selectionRouting = (answer) => {
        const split = answer.selection.split(" ");

        switch(split[0]) {
            case `View`:
                viewDB(split[1]);
            break;
            case `Add`:
                addDBSetUp(split[1]);
            break;
            case `Remove`:
                removeDB(split[1]);
            break;
            case `Change`:
                changeRole();
            break;
            // case `Assign`:
            // break;
            // case `Make`:
            // break;
            // case `Revoke`:
            // break;
            // case `List`:
            // break;
            // case `Generate`:
            // break;
        }
    } 

    // General Menu
    const generalMenu = () => {
        console.log(`Welcome to Ryan's Employee Database!`)
        inquirer
            .prompt({
                pageSize: 22,
                name: 'selection',
                type: 'list',
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
                    'Revoke Manager Status',
                    new inquirer.Separator(`\n==== Roles ====`),
                    'View Role',
                    'Add Role',
                    'Remove Role',
                    new inquirer.Separator(`\n==== Departments ====`),
                    'View Department',
                    'Add Department',
                    'Remove Department',
                    new inquirer.Separator(`\n==== Other ====`),
                    'List Team by Manager',
                    'Generate Utilized Budget Report'
                ]}).then((answer) => {
                    console.log(answer)
                    selectionRouting(answer);
                });
        }
})

