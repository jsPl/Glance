/*
 * Copyright (C) 2018 Ryan Mason - All Rights Reserved
 *
 * Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 *
 * https://github.com/Rytiggy/Glance/blob/master/LICENSE
 * ------------------------------------------------
 *
 * You are free to modify the code but please leave the copyright in the header.
 *
 * ------------------------------------------------
 */
//import Sizeof from "./sizeof.js";

// this module handles standardizing return data from various APIS
export default class standardize {
	// Expected values in return array of bloodsugars 
	// sgv:
	// datetime:
	// bgdelta:
	bloodsugars(data, extraData, settings) {
		settings.dexcomUsername = '';
		settings.dexcomPassword = '';

		let bgs = data;
		let rawbg = '';
		let tempBasal = '';
		let predictedBg = '';
		let loopStatus = '';
		let upbat = '';
		let sage = ''

		if (bgs && !data.error && data && bgs !== 'undefined' && Array.isArray(bgs) && bgs.length > 0) {
			if (settings.dataSource === 'xdrip' || settings.dataSource === 'custom') {
				// xdrip using the sgv endpoint still
				if (Array.isArray(bgs)) {
					bgs[0].datetime = bgs[0].date;
					bgs[0].bgdelta = bgs[0].sgv - bgs[1].sgv; //element.delta;
				}
				else {
					bgs = [];
				}
			}

			// Look for current non Predictive bg and not the last 5 predictions
			// this works because only the current bg has a delta so we can filter for it
			let nonPredictiveBg = bgs.filter(bg => bg.bgdelta)[0];

			let hasFoundFirstDelta = false;
			bgs.forEach((bg) => {
				if (bg.bgdelta != null && !hasFoundFirstDelta) {
					nonPredictiveBg = bg;
					hasFoundFirstDelta = true;
				}
			})

			// Look at the data that we are getting and if the SGV is below 25 we know the unit type is mmol
			if (nonPredictiveBg.sgv < 25) {
				bgs.forEach((bg) => {
					bg.sgv = mgdl(bg.sgv)
				});
				nonPredictiveBg.bgdelta = mgdl(nonPredictiveBg.bgdelta)
			}

			let currentBG = nonPredictiveBg.sgv;

			// Convert any values to desired units type 
			if (settings.glucoseUnits === 'mmol') {
				currentBG = mmol(currentBG)
				rawbg = mmol(rawbg);
				nonPredictiveBg.bgdelta = mmol(nonPredictiveBg.bgdelta);
			}

			checkTimeBetweenGraphPoints(bgs, nonPredictiveBg)

			// remove any keys/values that we dont use from responce
			let propsToRemove = ['date', 'delta', 'dateString', 'dateString', 'units_hint', 'type', 'rssi', 'sysTime', 'device', '_id', 'direction', 'bwpo', 'noise', 'trend', 'filtered', 'unfiltered', 'battery', 'bwp'];
			let cleanedBgs = bgs.map(tempBgs => {
				let temp = Object.keys(tempBgs).reduce((object, key) => {
					if (!(propsToRemove.includes(key))) {
						object[key] = tempBgs[key];
					}
					return object;
				}, {})
				return temp;
			});


			// The only BG that will have a bgdelta will be the current one
			// Add other important info to current bg in sgv array
			cleanedBgs.map((bg) => {
				if (bg.bgdelta != null) {
					// any values put here will be able to be entered in the layout
					bg.sgv = bg.sgv;
					if (bg.iob) {
						bg.iob = Math.round((Number(bg.iob) + 0.00001) * 100) / 100 //parseInt(bg.iob, 10).toFixed(1);
					} else {
						bg.iob = 0;
					}
					if (bg.cob) {
						bg.cob = Math.round((Number(bg.cob, 10) + 0.00001) * 100) / 100
					} else {
						bg.cob = 0;
					}
					bg.datetime = nonPredictiveBg.datetime;
					bg.direction = nonPredictiveBg.direction;
					bg.rawbg = ((rawbg && rawbg !== '0.0') ? (rawbg + ' raw') : '');
					bg.tempbasal = tempBasal;
					bg.currentbg = currentBG;
					bg.predictedbg = predictedBg;
					bg.loopstatus = checkLoopStatus(loopStatus);
					bg.upbat = upbat;
					bg.sage = ((sage) ? ('SA:' + sage) : '');
					if (nonPredictiveBg.direction === 'NOT COMPUTABLE') {
						bg.direction = 'none';
					}
					return bg;
				}
				return bg;
			});

			return {
				bgs: cleanedBgs
			}
		}

		bgs = [{
			sgv: '120',
			bgdelta: 0,
			iob: 0,
			cob: 0,
			datetime: new Date().getTime(),
			direction: 'warning',
			currentbg: (data.error ? ('E' + data.error.status) : 'DSE'),
			rawbg: '',
			tempbasal: '',
			loopstatus: '',
		}]

		let i = 46;
		while (i--) { bgs.push({ sgv: 120 }) }

		return { bgs }
	}
	settings(settings) {
		// Convert any values to desired units type 
		if (settings.glucoseUnits === 'mmol') {
			settings.highThreshold = mgdl(settings.highThreshold);
			settings.lowThreshold = mgdl(settings.lowThreshold);
		}
		return settings;
	}
};

//helper functions
// converts a mg/dL to mmoL
function mmol(bg, roundToHundredths) {
	return (Math.round((bg / 18) * 10) / 10).toFixed(1);
}

// converts mmoL to  mg/dL 
function mgdl(bg) {
	let mgdlBG = (Math.round(bg * 18.018).toFixed(0));

	return mgdlBG;
}

/** Do any mutations to the loop status text*/
function checkLoopStatus(status) {
	let text = status;
	if (text == 'Recomendation') {
		text = 'Recommend';
	}
	return text;
}

// Check The time in betweek each SGV and add LOS value if time is greater then 5 minutes 
function checkTimeBetweenGraphPoints(bgs, firstNonPredictiveBg) {
	let firstRun = true;
	let firstNonPredictiveBgIndex = bgs.indexOf(firstNonPredictiveBg);

	bgs.forEach((bg, index) => {
		let nextIndex = index + 1;
		// No need to run on predicted BGS
		if (!bg.p && bgs[nextIndex]) {
			let bgOne = new Date(bgs[index].datetime);
			let bgTwo = new Date(bgs[nextIndex].datetime);
			let bgMinutesDiff = Math.floor((((bgOne.getTime() - bgTwo.getTime()) / 1000) / 60));
			// pointsToSkip: count of how many points in array we did not have a bg
			let pointsToSkip = Math.ceil(bgMinutesDiff / 5) - 2;
			let indexToMoveTo = index + pointsToSkip;

			if (firstRun) {
				firstRun = false;

				if (pointsToSkip === -1) {// if there are more then 2 points that are not LOS from first point  
					bgOne = new Date(); // current time
					bgTwo = new Date(bgs[index].datetime);
					bgMinutesDiff = Math.floor((((bgOne.getTime() - bgTwo.getTime()) / 1000) / 60));
					// pointsToSkip: count of how many points in array we did not have a bg
					pointsToSkip = Math.ceil(bgMinutesDiff / 5) - 2;
					indexToMoveTo = index + pointsToSkip;

					if (pointsToSkip >= 1) {
						for (let i = index; i <= indexToMoveTo; i++) {
							if (i === firstNonPredictiveBgIndex) {
								bgs.splice(i, 0, {
									...bgs[i],
									sgv: "LOS",
									datetime: bgs[i].datetime
								})
							} else {
								bgs.splice(i, 0, {
									// ...bgs[i],
									sgv: "LOS",
									datetime: bgs[i].datetime
								})
							}
						}
					}

				} else { // if its the first point with LOS after it
					if (pointsToSkip >= 1) {
						for (let i = index; i <= indexToMoveTo; i++) {
							bgs.splice(i + 1, 0, {
								sgv: "LOS",
								datetime: bgs[i + 1].datetime
							})
						}
					}
				}
			} else {
				if (pointsToSkip >= 1) {
					for (let i = index; i <= indexToMoveTo; i++) {
						bgs.splice(i + 1, 0, {
							sgv: "LOS",
							datetime: bgs[i + 1].datetime
						})
					}
				}
			}
		}
	});
	// remove any values after 47
	bgs.splice(47, (bgs.length - 47))
}