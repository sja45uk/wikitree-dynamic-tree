/*
 * WikiTreeAPI.js
 *
 * Provide a "Person" object where data is gathered from the WikiTree API.
 * We use the WikiTree API action "getPerson" to retrieve the profile data and then store it in object fields.
 *
 */

// Put our functions into a "WikiTreeAPI" namespace.
window.WikiTreeAPI = window.WikiTreeAPI || {};

// Our basic constructor for a Person. We expect the "person" data from the API returned result
// (see getPerson below). The basic fields are just stored in the internal _data array.
// We pull out the Parent and Child elements as their own Person objects.
WikiTreeAPI.Person = class Person {
    constructor(data) {
        this._data = data;

        if (data.Parents) {
            for (var p in data.Parents) {
                this._data.Parents[p] = new WikiTreeAPI.Person(data.Parents[p]);
            }
        }
        if (data.Children) {
            for (var c in data.Children) {
                this._data.Children[c] = new WikiTreeAPI.Person(data.Children[c]);
            }
        }
    }

    // Basic "getters" for the data elements.
    getId() {
        return this._data.Id;
    }
    getName() {
        return this._data.Name;
    }
    getGender() {
        return this._data.Gender;
    }
    getBirthDate() {
        return this._data.BirthDate;
    }
    getBirthLocation() {
        return this._data.BirthLocation;
    }
    getDeathDate() {
        return this._data.DeathDate;
    }
    getDeathLocation() {
        return this._data.DeathLocation;
    }
    getChildren() {
        return this._data.Children;
    }
    getFatherId() {
        return this._data.Father;
    }
    getMotherId() {
        return this._data.Mother;
    }
    getDisplayName() {
        return this._data.BirthName ? this._data.BirthName : this._data.BirthNamePrivate;
    }
    getPhotoUrl() {
        if (this._data.PhotoData && this._data.PhotoData["url"]) {
            return this._data.PhotoData["url"];
        }
    }

    // Getters for Mother and Father return the Person objects, if there is one.
    // The getMotherId and getFatherId functions above return the actual .Mother and .Father data elements (ids).
    getMother() {
        if (this._data.Mother && this._data.Parents) {
            return this._data.Parents[this._data.Mother];
        }
    }
    getFather() {
        if (this._data.Father && this._data.Parents) {
            return this._data.Parents[this._data.Father];
        }
    }

    // We use a few "setters". For the parents, we want to update the Parents Person objects as well as the ids themselves.
    // For TreeViewer we only set the parents and children, so we don't need setters for all the _data elements.
    setMother(person) {
        var id = person.getId();
        var oldId = this._data.Mother;
        this._data.Mother = id;
        if (!this._data.Parents) {
            this._data.Parents = {};
        } else if (oldId) {
            delete this._data.Parents[oldId];
        }
        this._data.Parents[id] = person;
    }
    setFather(person) {
        var id = person.getId();
        var oldId = this._data.Father;
        this._data.Father = id;
        if (!this._data.Parents) {
            this._data.Parents = {};
        } else if (oldId) {
            delete this._data.Parents[oldId];
        }
        this._data.Parents[id] = person;
    }
    setChildren(children) {
        this._data.Children = children;
    }
}; // End Person class definition

// To get a Person for a given id, we POST to the API's getPerson action. When we get a result back,
// we convert the returned JSON data into a Person object.
// Note that postToAPI returns the Promise from jquerys .ajax() call.
// That feeds our .then() here, which also returns a Promise, which gets resolved by the return inside the "then" function.
// So we can use this through our asynchronous actions with something like:
// WikiTree.getPerson.then(function(result) {
//    // the "result" here is that from our API call. The profile data is in result[0].person.
// });
//
WikiTreeAPI.getPerson = function (id, fields) {
    return WikiTreeAPI.postToAPI({ action: "getPerson", key: id, fields: fields.join(","), resolveRedirect: 1 }).then(
        function (result) {
            return new WikiTreeAPI.Person(result[0].person);
        }
    );
};
// To get a set of Ancestors for a given id, we POST to the API's getAncestors action. When we get a result back,
// we leave the result as an array of objects
// Note that postToAPI returns the Promise from jquerys .ajax() call.
// That feeds our .then() here, which also returns a Promise, which gets resolved by the return inside the "then" function.

// So we can use this through our asynchronous actions with something like:
// WikiTree.getAncestors(myID, 5, ['Id','Name', 'LastNameAtBirth']).then(function(result) {
//    // the "result" here is that from our API call. The profile data is in result[0].ancestors, which will be an array of objects
// });

// WARNING:  If you just do a NewAncestorsArray = WikiTree.getAncestors(id,depth,fields);
//     --> what you get is the promise object - NOT the array of ancestors you might expect.
// You HAVE to use the .then() with embedded function to wait and process the results
//
WikiTreeAPI.getAncestors = function (id, depth, fields) {
    return WikiTreeAPI.postToAPI({
        action: "getAncestors",
        key: id,
        depth: depth,
        fields: fields.join(","),
        resolveRedirect: 1,
    }).then(function (result) {
        // console.log( result[0].ancestors );
        return result[0].ancestors;
    });
};

// To get a set of Relatives for a given id or a SET of ids, we POST to the API's getRelatives action. When we get a result back,
// we leave the result as an array of objects
// Note that postToAPI returns the Promise from jquerys .ajax() call.
// That feeds our .then() here, which also returns a Promise, which gets resolved by the return inside the "then" function.

// PARAMETERS:
//		IDs 	: can be a single string, with a single ID or a set of comma separated IDs - OR - it can be an array of IDs
//		fields	: an array of fields to return for each profile (same as for getPerson or getProfile)
//		options	: an option object which can contain these key-value pairs
// bioFormat	Optional: "wiki", "html", or "both"
// getParents	If true, the parents are returned
// getChildren	If true, the children are returned
// getSiblings	If true, the siblings are returned
// getSpouses	If true, the spouses are returned

// So we can use this through our asynchronous actions with something like:

// WikiTree.getRelatives(nextIDsToLoad, ['Id','Name', 'LastNameAtBirth'], {getParents:true} ).then(
//		function(result) {
//  	 	  // FUNCTION STUFF GOES HERE TO PROCESS THE ITEMS returned
//				 for (let index = 0; index < result.length; index++) {
//				 	thePeopleList.add(result[index].person);
//				 }
//		};

// NOTE:  the "result" here that is the input to the .then function is the JSON from our API call. The profile data is in result[0].items, which will be an array of objects
//  Each object (or item) has a key, user_id, user_name, then a person object (that contains the fields requested),
//	 and inside that person object could be a Parents object, a Children object, a Siblings object and a Spouses object.
//   If there is a Parents object, then in the list of fields will be Mother and Father, even if they weren't originally in the fields list parameter
// });

// WARNING:  See note above about what you get if you don't use the .then() ....
//
WikiTreeAPI.getRelatives = function (IDs, fields, options = {}) {
    let getRelativesParameters = {
        action: "getRelatives",
        keys: IDs.join(","),
        fields: fields.join(","),
        resolveRedirect: 1,
    };

    // go through the options object, and add any of those options to the getRelativesParameters
    for (const key in options) {
        if (Object.hasOwnProperty.call(options, key)) {
            const element = options[key];
            getRelativesParameters[key] = element;
        }
    }
    // console.log("getRelativesParameters: ", getRelativesParameters);

    return WikiTreeAPI.postToAPI(getRelativesParameters).then(function (result) {
        // console.log("RESULT from getRelatives:", result );
        return result[0].items;
    });
};

// This is just a wrapper for the Ajax call, sending along necessary options for the WikiTree API.
WikiTreeAPI.postToAPI = function (postData) {
    var API_URL = "https://api.wikitree.com/api.php";

    var ajax = $.ajax({
        // The WikiTree API endpoint
        url: API_URL,

        // We tell the browser to send any cookie credentials we might have (in case we authenticated).
        xhrFields: { withCredentials: true },

        // We're POSTing the data, so we don't worry about URL size limits and want JSON back.
        type: "POST",
        dataType: "json",
        data: postData,
    });

    return ajax;
};

// Utility function to get/set cookie data.
// Adapted from https://github.com/carhartl/jquery-cookie which is obsolete and has been
// superseded by https://github.com/js-cookie/js-cookie. The latter is a much more complete cookie utility.
// Here we just want to get and set some simple values in limited circumstances to track an API login.
// So we'll use a stripped-down function here and eliminate a prerequisite. This function should not be used
// in complex circumstances.
//
// key     = The name of the cookie to set/read. If reading and no key, then array of all key/value pairs is returned.
// value   = The value to set the cookie to. If undefined, the value is instead returned. If null, cookie is deleted.
// options = Used when setting the cookie,
//           options.expires = Date or number of days in the future (converted to Date for cookie)
//           options.path, e.g. "/"
//           options.domain, e.g. "apps.wikitree.com"
//           options.secure, if true then cookie created with ";secure"
WikiTreeAPI.cookie = function (key, value, options) {
    if (options === undefined) {
        options = {};
    }

    // If we have a value, we're writing/setting the cookie.
    if (value !== undefined) {
        if (value === null) {
            options.expires = -1;
        }
        if (typeof options.expires === "number") {
            var days = options.expires;
            options.expires = new Date();
            options.expires.setDate(options.expires.getDate() + days);
        }
        value = String(value);
        return (document.cookie = [
            encodeURIComponent(key),
            "=",
            value,
            options.expires ? "; expires=" + options.expires.toUTCString() : "",
            options.path ? "; path=" + options.path : "",
            options.domain ? "; domain=" + options.domain : "",
            options.secure ? "; secure" : "",
        ].join(""));
    }

    // We're not writing/setting the cookie, we're reading a value from it.
    var cookies = document.cookie.split("; ");

    var result = key ? null : {};
    for (var i = 0, l = cookies.length; i < l; i++) {
        var parts = cookies[i].split("=");
        var name = parts.shift();
        name = decodeURIComponent(name.replace(/\+/g, " "));
        var value = parts.join("=");
        value = decodeURIComponent(value.replace(/\+/g, " "));

        if (key && key === name) {
            result = value;
            break;
        }
        if (!key) {
            result[name] = value;
        }
    }
    return result;
};