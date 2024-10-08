import { setUpdate, update } from "../mainComponents/sidebar/main";

class PersonQueue {
    //automatically remove last element if the queue size 
    // is more than 20
    constructor() {
        this.persons = {}
        this.frontIndex = 0
        this.backIndex = 0
    }

    enqueue(person) {
        let index = this.isAlreadyPresent(person.userId); // index = queuindex if present. else null
        if (index != null) {
            delete this.persons[index];
        }
        this.persons[this.backIndex] = person;
        this.backIndex ++
        while (Object.keys(this.persons).length > 100) { //adjust local storage 
            this.dequeue()
        }
    }

    dequeue() {
        const person = this.persons[this.frontIndex]
        delete this.persons[this.frontIndex]
        this.frontIndex ++
        return person
    }

    //return queuId in persons if present else null
    isAlreadyPresent(userId){
        for (const key of Object.keys(this.persons)) {
            if (userId === this.persons[key].userId){
                return key;
            }
        }
        return null;
    }


}

//we use as local storage
const localPerson = new PersonQueue();

const searchByNameLocal = (substring) => {
    const similarName = []
    //key:  will be number from the class PersonQueue
    if (substring !== '') {
        for (const key of  Object.keys(localPerson.persons)) {
            if (localPerson.persons[key].userName.includes(substring)) {
                similarName.push(localPerson.persons[key])  //queuid will be present
            }
        }
    }
    return similarName;
}


const addToLocalPersons = (person) => {
    localPerson.enqueue(person);
}


export {localPerson, searchByNameLocal,addToLocalPersons}
