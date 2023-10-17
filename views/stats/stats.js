class StatsView extends View {
    genNames = [];
    GENERATIONS = 10;
    ancestors = {};

    meta() {
        return {
            // short title - will be in select control
            title: "Ancestor Statistics",
            // some longer description or usage
            description: "",
            // link pointing at some webpage with documentation
            docs: "",
        };
    }

    init(container_selector, person_id) {
        // do whathever you want there
        // to showcase your awesome view, e.g.
        document.querySelector(container_selector).innerHTML = `
            <table id="stats-table">
                <thead>
                    <tr>
                        <th>Generation</th>
                        <th>Relation</th>
                        <th>Total w/ Birth Year</th>
                        <th>Earliest Birth Year</th>
                        <th>Latest Birth Year</th>
                        <th>Average Birth Year</th>
                        <th>Gen Length</th>
                        <th>Average Lifespan</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div id="results"></div>
        `;

        this.gatherStats(person_id);
    }

    async gatherStats(id) {
        this.fillGenNames();

        await this.getAncestors(id);

        this.calculateAvgAgeEachGen();
    }

    fillGenNames() {
        this.genNames[0] = "Self";
        this.genNames[1] = "Parents";
        this.genNames[2] = "Grandparents";
        this.genNames[3] = "Great-Grandparents";
        if (this.GENERATIONS > 3) {
            for (let i = 4; i <= this.GENERATIONS; i++) {
                let greats = i - 2;
                this.genNames[i] = greats + "x Great-Grandparents";
            }
        }
    }

    async getAncestors(id) {
        // get ancestors of given ID with getPeople
        const ancestors = await WikiTreeAPI.getPeople(
            "stats",
            id,
            ["BirthDate, DeathDate, Name, Derived.BirthName, Meta"],
            {
                ancestors: this.GENERATIONS,
            }
        );
        // save the list of ancestors
        this.ancestors = ancestors[2];
    }

    calculateAvgAgeEachGen() {
        let oldestAge = 0;
        let oldestPerson = "";

        // fill array with the birth years of all ancestors in each generation and death years

        // setup birth and death year storage with an array for each generation
        const birthYears = {};
        const deathAges = {};
        for (let i = 0; i <= this.GENERATIONS; i++) {
            birthYears[i] = [];
            deathAges[i] = [];
        }

        // for each ancestor
        for (const person in this.ancestors) {
            const ancestor = this.ancestors[person];

            console.log(ancestor);

            let ancestorGeneration = ancestor["Meta"]["Degrees"];
            let ancestorBirthYear = parseInt(ancestor["BirthDate"].substring(0, 4));
            let ancestorDeathYear = parseInt(ancestor["DeathDate"].substring(0, 4));

            // add the birth year to the proper generation
            let birthGeneration = birthYears[ancestorGeneration];
            if (ancestorBirthYear > 0) {
                birthGeneration.push(ancestorBirthYear);
            }

            // add the death age to the proper generation
            let ancestorAgeAtDeath = this.getAgeAtDeath(ancestor["BirthDate"], ancestor["DeathDate"]);
            let deathAgeGeneration = deathAges[ancestorGeneration];
            if (ancestorAgeAtDeath != null) {
                deathAgeGeneration.push(ancestorAgeAtDeath);
            }

            // check if this ancestor is the oldest one so far
            if (ancestorAgeAtDeath > oldestAge) {
                oldestAge = ancestorAgeAtDeath;
                oldestPerson = `
                    <a href="https://www.wikitree.com/wiki/${ancestor["Name"]}" target="_blank">${ancestor["BirthName"]}</a>`;
            }
        }

        // sort birth years by earliest to latest
        for (const generation in birthYears) {
            birthYears[generation].sort(this.sortByYear);
        }

        // calculate the earliest birth year for each generation
        const earliestBirthYears = [];
        for (const generation in birthYears) {
            let earliestBirthYear;
            if (birthYears[generation][0] != undefined) {
                earliestBirthYear = birthYears[generation][0];
            } else {
                earliestBirthYear = "-";
            }
            earliestBirthYears.push(earliestBirthYear);
        }

        // calculate the latest birth year for each generation
        const latestBirthYears = [];
        for (const generation in birthYears) {
            let latestBirthYear;
            if (birthYears[generation][birthYears[generation].length - 1] != undefined) {
                latestBirthYear = birthYears[generation][birthYears[generation].length - 1];
            } else {
                latestBirthYear = "-";
            }
            latestBirthYears.push(latestBirthYear);
        }

        // calculate the average birth year for each generation
        const avgBirthYears = [];
        for (const generation in birthYears) {
            let avgBirthYear;
            let sumOfBirthYears = 0;
            let countOfBirthYears = birthYears[generation].length;
            for (const year in birthYears[generation]) {
                sumOfBirthYears += birthYears[generation][year];
            }
            avgBirthYear = Math.round(sumOfBirthYears / countOfBirthYears);
            if (isNaN(avgBirthYear)) {
                avgBirthYear = "-";
            }
            avgBirthYears.push(avgBirthYear);
        }

        // calculate the generation length for each generation -- average age of giving birth to your ancestor
        const avgGenLengths = [];
        for (const generation in birthYears) {
            let genLength = avgBirthYears[generation - 1] - avgBirthYears[generation];

            if (isNaN(genLength) || genLength == 0) {
                genLength = "-";
            }

            avgGenLengths.push(genLength);
        }

        // calculate the average lifespan for each generation
        const avgLifeSpans = [];
        for (const generation in deathAges) {
            let avgLifeSpan;
            let deathAgeSum = 0;
            let deathAgeCount = deathAges[generation].length;
            for (const age in deathAges[generation]) {
                deathAgeSum += deathAges[generation][age];
            }
            avgLifeSpan = Math.round(deathAgeSum / deathAgeCount);
            if (isNaN(avgLifeSpan)) {
                avgLifeSpan = "-";
            }
            avgLifeSpans.push(avgLifeSpan);
        }

        // calculate the average generation length overall
        let overallAvgGenLength = 0;
        let genLengthSum = 0;
        let totalGenLengths = 0;

        for (const genLength in avgGenLengths) {
            if (avgGenLengths[genLength] != "-") {
                genLengthSum += avgGenLengths[genLength];
                totalGenLengths++;
            }
        }
        overallAvgGenLength = Math.round(genLengthSum / totalGenLengths);
        let results = document.getElementById("results");
        results.id = "results-container";

        let avgGenLengthDiv = document.createElement("div");
        avgGenLengthDiv.innerHTML = `Average generation length: ${overallAvgGenLength}`;
        results.appendChild(avgGenLengthDiv);

        // calculate the average lifespan overall
        let overallAvgLifeSpan = 0;
        let lifeSpanSum = 0;
        let totalLifeSpans = 0;

        for (const lifeSpan in avgLifeSpans) {
            if (avgLifeSpans[lifeSpan] != "-") {
                lifeSpanSum += avgLifeSpans[lifeSpan];
                totalLifeSpans++;
            }
        }
        overallAvgLifeSpan = Math.round(lifeSpanSum / totalLifeSpans);
        let avgLifeSpanDiv = document.createElement("div");
        avgLifeSpanDiv.innerHTML = `Average lifespan: ${overallAvgLifeSpan}`;
        results.appendChild(avgLifeSpanDiv);

        // show oldest ancestor
        let oldestAncestorDiv = document.createElement("div");
        oldestAncestorDiv.innerHTML = `Oldest ancestor: ${oldestPerson}, ${oldestAge} years old.`;
        results.appendChild(oldestAncestorDiv);

        this.fillTable({
            birthYears: birthYears,
            earliestBirthYears: earliestBirthYears,
            latestBirthYears: latestBirthYears,
            avgBirthYears: avgBirthYears,
            avgGenLengths: avgGenLengths,
            avgLifeSpans: avgLifeSpans,
        });
    }

    fillTable(stats) {
        let table = document.querySelector("#stats-table > tbody");

        for (let generation = 0; generation < this.GENERATIONS; generation++) {
            let maxAncestorsForGen = Math.pow(2, generation);

            let row = table.insertRow(-1);
            row.insertCell(0).innerHTML = generation + 1;
            row.insertCell(1).innerHTML = this.genNames[generation];
            row.insertCell(2).innerHTML = `${stats.birthYears[generation].length}/${maxAncestorsForGen}`;
            row.insertCell(3).innerHTML = stats.earliestBirthYears[generation];
            row.insertCell(4).innerHTML = stats.latestBirthYears[generation];
            row.insertCell(5).innerHTML = stats.avgBirthYears[generation];
            row.insertCell(6).innerHTML = stats.avgGenLengths[generation];
            row.insertCell(7).innerHTML = stats.avgLifeSpans[generation];
        }
    }

    getAgeAtDeath(birth, death) {
        let birthDate;
        let deathDate;

        if (this.getMonth(birth) != "00" && this.getDay(birth) != "00") {
            birthDate = new Date(birth);
        } else if (this.getYear(birth) == "0000") {
            birthDate = new Date(birth);
        } else {
            birthDate = new Date(this.getYear(birth));
        }

        if (this.getMonth(death) != "00" && this.getDay(death) != "00") {
            deathDate = new Date(death);
        } else if (this.getYear(death) == "0000") {
            deathDate = new Date(death);
        } else {
            deathDate = new Date(this.getYear(death));
        }

        if (birthDate != "Invalid Date" && deathDate != "Invalid Date") {
            let age = Math.floor((deathDate - birthDate) / 31536000000);
            if (age > 0) {
                return age;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    getYear(date) {
        return date.substring(0, 4);
    }

    getMonth(date) {
        return date.substring(5, 7);
    }

    getDay(date) {
        return date.substring(8, 10);
    }

    sortByYear(a, b) {
        return a - b;
    }
}
