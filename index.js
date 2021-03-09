// Modules and Variables.
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


// Input Credentials
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

// Compare Credentials
access().then((credentials) => {
    compareHash(`username`, credentials.username);
    compareHash(`password`, credentials.password);

    // MySQL Connection.
    const connection = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: credentials.username,
        password: credentials.password,
        database: 'employee-database',
    });

    // Connect to MySQL
    connection.connect((err) => {
        if (err) throw err;
        console.log("connection to database successful.\n");
        generalMenu();
    });

    // View any table in the Database, pulls SQL query from templates.js
    const viewDB = (param) => {
        let query = templates.View[param];
        connection.query(query, (err, res) => {
            if (err) throw err;
            console.table(res);
            generalMenu();
        })
    }

    // Routing for adding an entry to a table in the database.
    const addDBSetUp = (param) => {
        const paramList = [];
        switch(param) {
            case `Employee`:
                connection.query(`SELECT Role FROM role`, ((err, res) => {
                    if (err) throw err;
                    res.forEach((ele) => paramList.push(`${ele.Role}`));
                    addDB(param, paramList);
                }))
            break;
            case `Role`:
                connection.query(`SELECT Department FROM department`, ((err, res) => {
                    if (err) throw err;
                    res.forEach((ele) => paramList.push(`${ele.Department}`));
                    addDB(param, paramList);
                }))
            break;
            default:
                addDB(param, [])
        }
    }

    // Adds an entry to a table in the database.
    const addDB = (param, list) => {
        if (list !== undefined && list.length > 0) templates.QuestionList[param][0].choices = list;
        inquirer.prompt(templates.QuestionList[param]).then((answer) => {
            const firstKey = Object.keys(answer)[0].split("_")
            if ( firstKey[0] === "id" ) {
                connection.query(`SELECT id FROM ${firstKey[1]} WHERE ${firstKey[1]} = ?`, Object.values(answer)[0], (err, res) => {
                    if (err) throw err;
                    answer[Object.keys(answer)[0]] = res[0].id;
                    connection.query(`INSERT INTO ${param} SET ?`, answer, (err, res) => {
                        if (err) throw err; 
                        console.log(`Entry Added!\n`)
                        generalMenu();
                    })
                })
            } else {
                connection.query(`INSERT INTO ${param} SET ?`, answer, (err, res) => {
                    if (err) throw err; 
                    console.log(`Entry Added!\n`)
                    generalMenu();
                })
            }
        })
    }

    // Remove an entry from the database.
    const removeDB = (param) => {
        let select = param;
        switch (param) {
            case 'Employee':
                select = `CONCAT(first_name, " " , last_name)`;
            break;
        }
        connection.query(`SELECT ${select} AS ${param} FROM ${param}`, (err, res) => {
            if (err) throw err;
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
                        if (err) throw err;
                        console.log(`Entry Deleted!\n`)
                        generalMenu();
                    });
                })
        })
    }

    // Change an Employee role.
    const changeRole = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM employee`, (err, res) => {
            if (err) throw err;
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
                        if (err) throw err;
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
                                connection.query(`SELECT id FROM role WHERE Role = ?`, role, (err, res) => {
                                    if (err) throw err;
                                    const roleID = res[0].id;
                                    connection.query(`UPDATE Employee SET id_role = ? WHERE CONCAT(first_name, " " , last_name) = ?`, [roleID, employee], (err, res) => {
                                        if (err) throw err;
                                        console.log(`Role updated!\n`);
                                        generalMenu();
                                    })
                                })
                            })
                    })
                })
        })
    }

    // Assign a team to a specific manager.
    const assignManager = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Manager FROM employee WHERE isManager = ?`, 1, (err, res) => {
            if (err) throw err;
            if (res === undefined || res.length === 0) {
                console.log(`There aren't currently any managers to be assigned to!\n`);
                generalMenu();
            } else {
            const managerMap = res.map((ele) => ele.Manager);
            inquirer
                .prompt({
                    pageSize: 5,
                    name: 'name',
                    type: 'list',
                    message: 'Which manager are you building a team for?',
                    choices: managerMap
                }).then((answer) => {
                    const manager = answer.name;
                    connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM employee WHERE isManager = ? AND 
                    ids_manager IS NULL`, 0, (err, res) => {
                        if (err) throw err;
                        const employeeMap = res.map((ele) => ele.Employee);
                        inquirer
                            .prompt({
                                pageSize: 5,
                                name: 'employeeList',
                                type: 'checkbox',
                                message: `Which employees would you like assigned to ${manager}? (Note: Manager's previous team will be erased, and employee's currently on other teams will not appear in list.)`,
                                choices: employeeMap
                            }).then((answer) => {
                                const employeeList = answer.employeeList;
                                connection.query(`SELECT id FROM Employee WHERE CONCAT(first_name, " " , last_name) = ?`, manager, (err, res) => {
                                    if (err) throw err;
                                    const managerID = res[0].id;
                                    connection.query(`UPDATE Employee SET ids_manager = NULL WHERE ids_manager = ? AND isManager = ?`, [managerID, 0], (err, res) => {
                                        if (err) throw err;
                                        if (employeeList !== undefined && employeeList.length > 0) {
                                            connection.query(`UPDATE Employee SET ids_manager = ? WHERE CONCAT(first_name, " " , last_name) IN ('${employeeList.join("', '")}')`, [managerID], (err, res) => {
                                                if (err) throw err;
                                                console.log(`${manager} assigned a team!\n`)
                                                generalMenu();
                                            })} else {
                                                console.log(`${manager}'s team unassigned!\n`)
                                                generalMenu();
                                                }
                                    })
                                })
                            })
                    })
                })
        }})
    }

    // Promote an Employee to manager.
    makeManager = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM Employee WHERE isManager = ? AND ids_manager IS NULL`, 0, (err, res) => {
            if (err) throw err;
            if (res === undefined || res.length === 0) {
                console.log(`There aren't currently any employees to be assigned as manager!\n`);
                generalMenu();
            } else {
                const employeeMap = res.map((ele) => ele.Employee);
                inquirer
                    .prompt({
                        pageSize: 5,
                        name: 'name',
                        type: 'list',
                        message: 'Which employee do you want to make a manager?',
                        choices: employeeMap
                    }).then((answer) => {
                        const employee = answer.name;
                        connection.query(`SELECT id FROM Employee WHERE CONCAT(first_name, " " , last_name) = ?`, employee, (err, res) => {
                            if (err) throw err;
                            const employeeID = res[0].id;
                            connection.query(`UPDATE Employee SET ids_manager = ? WHERE id = ?`, [employeeID, employeeID], (err, res) => {
                                if (err) throw err;
                                connection.query(`UPDATE Employee SET isManager = ? WHERE id = ?`, [1, employeeID], (err, res) => {
                                    if (err) throw err;
                                    console.log(`${employee} made a manager!\n`);
                                    generalMenu();
                                })
                            })
                        })
                    })
                }
        });
    }

    // Revoke Manager status from an employee.
    revokeManager = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM Employee WHERE isManager = ?`, 1, (err, res) => {
            if (err) throw err;
            if (res === undefined || res.length === 0) {
                console.log(`There aren't currently any managers!\n`);
                generalMenu();
            } else {
                const employeeMap = res.map((ele) => ele.Employee);
                inquirer
                    .prompt({
                        pageSize: 5,
                        name: 'name',
                        type: 'list',
                        message: 'Which employee do you want to revoke manager title from?',
                        choices: employeeMap
                    }).then((answer) => {
                        const employee = answer.name;
                        connection.query(`SELECT id FROM Employee WHERE CONCAT(first_name, " " , last_name) = ?`, employee, (err, res) => {
                            if (err) throw err;
                            const employeeID = res[0].id;
                            connection.query(`UPDATE Employee SET ids_manager = NULL WHERE ids_manager = ?`, employeeID, (err, res) => {
                                if (err) throw err;
                                connection.query(`UPDATE Employee SET isManager = ? WHERE id = ?`, [0, employeeID], (err, res) => {
                                    if (err) throw err;
                                    console.log(`${employee} has had manager title revoked!\n`);
                                    generalMenu();
                                })
                            })
                        })
                    })
                }
        });
    }

    // View a list of employee based on a selected manager.
    teamList = () => {
        connection.query(`SELECT CONCAT(first_name, " " , last_name) AS Employee FROM Employee WHERE isManager = ?`, 1, (err, res) => {
            if (err) throw err;
            if (res === undefined || res.length === 0) {
                console.log(`There aren't currently any managers!\n`);
                generalMenu();
            } else {
                const employeeMap = res.map((ele) => ele.Employee);
                inquirer
                    .prompt({
                        pageSize: 5,
                        name: 'name',
                        type: 'list',
                        message: 'Whose team do you want to see?',
                        choices: employeeMap
                    }).then((answer) => {
                        const employee = answer.name;
                        connection.query(`SELECT id FROM Employee WHERE CONCAT(first_name, " " , last_name) = ?`, employee, (err, res) => {
                        if (err) throw err;
                            const employeeID = res[0].id;
                            connection.query(`${templates.View.Employee} WHERE E.ids_manager = ? ORDER BY isManager DESC`, employeeID, (err, res) => {
                                if (err) throw err;
                                console.table(res);
                                generalMenu();
                            })
                        })
                    })
            }
        })
    }

    // Generate an expense summary by department.
    const generateExpense = () => {
        connection.query(`SELECT Department FROM Department`, 1, (err, res) => {
            if (err) throw err;
            const departmentMap = res.map((ele) => ele.Department);
            inquirer
                    .prompt({
                        pageSize: 5,
                        name: 'department',
                        type: 'list',
                        message: 'Which department would you like to see the budget for?',
                        choices: departmentMap
                    }).then((answer) => {
                        const department = answer.department;
                        connection.query(`SELECT id FROM Department WHERE Department = ?`, department, (err, res) => {
                            if (err) throw err;
                                const departmentID = res[0].id;
                                connection.query(`SELECT D.Department, SUM(R.Salary) AS Budget FROM department AS D LEFT JOIN role AS R ON D.id = R.id_department`, (err, res) => {
                                    if (err) throw err;
                                    console.table(res);
                                    generalMenu();
                                })

                            })
                    })
        })
    }

    // General Menu Selection Routing.
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
            case `Assign`:
                assignManager();
            break;
            case `Make`:
                makeManager();
            break;
            case `Revoke`:
                revokeManager();
            break;
            case `List`:
                teamList();
            break;
            case `Generate`:
                generateExpense();
            break;
        }
    } 

    // General Menu
    const generalMenu = () => {
        console.log(`Welcome to Ryan's Employee Database!`)
        inquirer
            .prompt({
                pageSize: 25,
                name: 'selection',
                type: 'list',
                message: 'What would you like to do?',
                choices: [
                    new inquirer.Separator(`\n==== Employees ====`),
                    'View Employee',
                    'Add Employee',
                    'Remove Employee',
                    'Change Role',
                    new inquirer.Separator(`--------`),
                    'Make Employee a Manager',
                    'Revoke Manager Status',
                    'Assign Team To Manager',
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
                    'Generate Utilized Budget Report',
                    new inquirer.Separator(` `)
                ]}).then((answer) => {
                    console.log(answer)
                    selectionRouting(answer);
                });
        }
})

