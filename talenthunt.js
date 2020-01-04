const fs = require('fs')
const inputFile = process.argv[2];

let data = fs.readFileSync(inputFile, 'utf8').split('\n\n\n');
let jobData = data[0].split('\n');
let candidateData = data[1].split('\n');

let jobRankings = {};
let candidateRankings = {};

for(let i = 0; i < jobData.length; i++){
	const jobLine = jobData[i];
	const candidateLine = candidateData[i];
	const jobKeyPos = jobLine.indexOf(':')
	const candidateKeyPos = candidateLine.indexOf(':')
	const jobKey = jobLine.slice(0, jobKeyPos);
	const candidateKey = candidateLine.slice(0, candidateKeyPos);
	const jobValues = jobLine.slice(jobKeyPos+2, jobLine.length).split(' ')
	const candidateValues = candidateLine.slice(candidateKeyPos+2, candidateLine.length).split(' ')
	jobRankings[jobKey] = jobValues;
	candidateRankings[candidateKey] = candidateValues
}

// The seed function first tries to match the each job to its most suitable candidate, 
// disregarding duplicates/overlaps
function seed(jobs){
	let matches = {};
	for(let job in jobs){
		// This retrieves the highest ranked candidate for the given job
		matches[job] = jobs[job][0];
	}
	return matches;
}

// Maps each candidate to the number of jobs that 'want' him
function candidateToJobs(matches){
	let result = {};
	for(let job in matches){
		let candidate = matches[job]; 
		if (result[candidate]) result[candidate].push(job)
		else result[candidate] = [job]; 
	}
	return result
} 


// Checks if each job has been matched to a candidate 1-1, indicating that it is stable
function allDifferent(c2j){
	for(let candidate in c2j){
		if(c2j[candidate].length > 1) return false
	}
	return true
}

// While not exactly necessarily, this function transforms the data in my output
// to the one specified on the spec (essentially inverts the job key and candidate value and sorts it)
function invert(matches){
	function sortObject(o) {
	    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
	}
	let result = {};
	for(var key in matches){
		result[matches[key]] = key;
	}
	return sortObject(result);
}

// This recursive function will match each job to a candidate
function findMatches(currMatches, step){
	//Base case
	let c2j = candidateToJobs(currMatches);
	if(allDifferent(c2j)) return currMatches;

	for(let candidate in c2j){
		let jobs = c2j[candidate];
		if(jobs.length > 1){
			let winner;
			let lowestIndex = Infinity;
			let ranking = candidateRankings[candidate];
			for(let job of jobs){
				let index = ranking.indexOf(job);
				if(index < lowestIndex){
					lowestIndex = index;
					winner = job
				}
			}
			// Remove the 'winner' of this candidate
			c2j[candidate].splice(c2j[candidate].indexOf(winner), 1)
			// Assign all of the 'losers' to their next higher ranking candidate
			c2j[candidate].forEach(loser=>{
				currMatches[loser] = jobRankings[loser][step];
			}) 
		}
	}
	return findMatches(currMatches, step+1)
}

const result = (invert(findMatches(seed(jobRankings), 1)))
let output = ""
for(let match in result){
	const line = `${match} ${result[match]}\n`
	output += line
}

fs.writeFileSync('./output.txt', output);
