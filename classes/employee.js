class Employee {
    constructor(first_name, last_name, id_role, id_manager, isManager) {
        this.first_name = first_name;
        this.last_name = last_name;
        this.id_role = id_role;
        this.id_manager = id_manager;
        this.isManager = isManager;
    }
}

module.exports = Employee;