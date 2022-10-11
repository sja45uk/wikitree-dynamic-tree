/*
 * AhnenTafel.js
/*
// **************************************
// A Class to hold an Ahentafel (table of ancestors) in an Array
// **************************************
/
 * The basic AhnenTafel is an associative array (.list)
 *       index: Ahentafel Number , value: WikiTree ID for the corresponding ancestor
 * 
 * NOTE:  The actual Person object for that person can be found using thePeopleList (an instance of PeopleCollection)
 * 
 * e.g.  If you're looking for the grandfather of the primary person
 *      paternalGrandDad = thePeopleList[ myAhnenTafel.list[ 4 ]  ]
 */

window.AhnenTafel = window.AhnenTafel || {};


// Our basic constructor for a PeopleList. We expect the "person" data from the API returned result
// (see getPerson below). The basic fields are just stored in the internal _data array.
// We pull out the Parent and Child elements as their own Person objects.
AhnenTafel.Ahnentafel = class Ahnentafel {

	constructor(data) {
		this.list = new Array([0]);        
    }
	
    // The update method takes a Person object as input
    // then makes that Person the Primary ID, Ahnentafel # 1, then
    // climbs through their ancestors to fill out the rest of the Ahnentafel
    update( newPerson ) {
        // console.log("Update the Ahnentafel object", newPerson);
       if (newPerson && newPerson._data.Id) {
            // this.PrimaryID = newPerson._data.Id
            this.list = [0 , newPerson._data.Id]; // initialize the Array

            if (newPerson._data.Father && newPerson._data.Father  > 0) {
                this.addToAhnenTafel(newPerson._data.Father, 2);
            }
            if (newPerson._data.Mother && newPerson._data.Mother  > 0) {
                this.addToAhnenTafel(newPerson._data.Mother, 3);
            }
        	this.listAll(); // sends message to the console.log for validation - this could be commented out and not hurt anything
       } 
    }

    // Stores the next person's WikiTree ID in position corresponding to their Ahnentafel number
    // THEN ... if they are a person in thePeopleList collection, check for THEIR parents, and recurse up the tree adding them!
    addToAhnenTafel(nextPersonID, ahnNum) {
        this.list[ahnNum] = nextPersonID;
		let nextPerson = thePeopleList[nextPersonID];
         if (nextPerson && nextPerson._data.Father && nextPerson._data.Father  > 0) {
            this.addToAhnenTafel(nextPerson._data.Father, 2*ahnNum);
        }
        if (nextPerson && nextPerson._data.Mother && nextPerson._data.Mother > 0) {
            this.addToAhnenTafel(nextPerson._data.Mother, 2*ahnNum + 1);
        }
    }

    // Returns an array of objects, each one holding the Ahnentafel #, and the WikiTree ID # for each ancestor
	listOfAncestors(){
		let theList = [];
		for (var i = 0; i < this.list.length; i++) {
			if(this.list[i] && this.list[i] > 0){
				theList.push( {ahnNum:i, id:this.list[i]});
			}
		}
		return theList;
	}
	
    // Returns an array of objects for building the Fan Chart (and potentially other trees)
    // Each entry contains the Ahnentafel #, and the Person object for each ancestor
    // Instead of sending JUST the list of Person Objects, this structure is needed to avoid collapsing trees
    // i.e. - the d3 Tree will only display UNIQUE ID #s - so - in the case where Ancestors repeat, if you go far enough back
    //     the multiple versions will not show - only the last one to be mapped to the tree
    // THIS way - using an object with a unique Ahnentafel # for each occurence of an ancestor,
    //  you can have as many as you need in the resulting Tree / Chart

	listOfAncestorsForFanChart( numGens = 5 ){
		let theList = [];
        let maxNum = this.list.length;
        let maxNumInGen = 2**numGens;
        let theMax = Math.min(maxNum, maxNumInGen);

		for (var i = 0; i < theMax; i++) {
			if(this.list[i] && this.list[i] > 0 &&  thePeopleList[ this.list[i] ] ){

                let thisAncestor = {ahnNum:i , person: thePeopleList[ this.list[i] ] };
                theList.push(  thisAncestor );

                    // console.log("--> PUSHED !",thisAncestor.ahnNum, thisAncestor.person._data.Id);                
			}
		}
        console.log("listOfAncestorsForFanChart has " , theList.length , " ancestors.");
		return theList;
	}
	
    // A very BASIC tool to use for quick console.log relief
    listAll() {
        console.log("Ahnentafel:", this);
    }
}
