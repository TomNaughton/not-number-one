// =========================================
// 1. THE DEMOGRAPHIC DATA
// =========================================

// Instead of individual rates, we track the master curve of GLOBAL yearly births.
// These are anchor points (estimates in millions) at the start of each decade.
const globalBirthsPerDecade = {
    1900: 40000000,
    1910: 43000000,
    1920: 48000000,
    1930: 52000000,
    1940: 58000000,
    1950: 97000000, // Post-WWII baby boom begins
    1960: 110000000,
    1970: 122000000,
    1980: 128000000,
    1990: 138000000,
    2000: 136000000,
    2010: 140000000,
    2020: 134000000,
    2030: 130000000  // Future projection to allow calculations up to 2029
};

// We define each role by its historical base at the year 1900, 
// and its "multiplier" (what % of global births result in minting this role).
const roleStats = {
    dad: { base1900: 15200000000, multiplier: 0.31, title: "Dad" },
    mum: { base1900: 15800000000, multiplier: 0.31, title: "Mum" },
    nan: { base1900: 5100000000, multiplier: 0.20, title: "Nan" },
    grandad: { base1900: 4800000000, multiplier: 0.19, title: "Grandad" },
    greatnan: { base1900: 600000000, multiplier: 0.04, title: "Great-Nan" },
    greatgrandad: { base1900: 550000000, multiplier: 0.03, title: "Great-Grandad" },
    auntie: { base1900: 21000000000, multiplier: 0.49, title: "Auntie" },
    uncle: { base1900: 20800000000, multiplier: 0.49, title: "Uncle" },
    stepmum: { base1900: 1200000000, multiplier: 0.10, title: "Step-Mum" },
    stepdad: { base1900: 1150000000, multiplier: 0.10, title: "Step-Dad" },
    catmum: { base1900: 300000000, multiplier: 0.25, title: "Cat Mum" },
    catdad: { base1900: 250000000, multiplier: 0.22, title: "Cat Dad" },
    dogmum: { base1900: 280000000, multiplier: 0.26, title: "Dog Mum" },
    dogdad: { base1900: 270000000, multiplier: 0.24, title: "Dog Dad" }
};

// =========================================
// 2. THE ENGINE
// =========================================

// This array will hold the exact interpolated birth rate for every year from 1900 to 2029
const yearlyBirths = {};

// When the file loads, build the exact year-by-year data using linear interpolation between decades
for (let decade = 1900; decade <= 2020; decade += 10) {
    const startBirths = globalBirthsPerDecade[decade];
    const endBirths = globalBirthsPerDecade[decade + 10];
    
    for (let year = 0; year < 10; year++) {
        // Find the precise step between the two decades
        const interpolatedValue = startBirths + ((endBirths - startBirths) * (year / 10));
        yearlyBirths[decade + year] = interpolatedValue;
    }
}

// =========================================
// 2.5 UI INITIALIZATION
// =========================================

// Set the maximum allowable date on the calendar input to "right now"
window.onload = function() {
    const dateInput = document.getElementById('statusDate');
    
    // Create a new Date object for the current exact moment
    const now = new Date();
    
    // Format the date to match the YYYY-MM-DDThh:mm format required by the input
    // We use a slight trick here to adjust for local timezone offset before converting to ISO string
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    // Slice off the seconds and milliseconds so it matches the input format exactly
    const maxDateString = now.toISOString().slice(0, 16);
    
    dateInput.max = maxDateString;
};

// =========================================
// 3. THE INTEGRATION LOOP
// =========================================

function performAccurateCalculation(targetDate, roleKey) {
    const role = roleStats[roleKey];
    let totalRank = role.base1900;
    
    const targetYear = targetDate.getFullYear();
    
    // Safety check for dates out of bounds
    if (targetYear < 1900 || targetYear > 2029) {
        alert("The Historical Registry only contains precise continuous data between 1900 and 2029.");
        return null;
    }

    // THE LOOP: Integrate over the curve for every full year that has passed
    for (let y = 1900; y < targetYear; y++) {
        totalRank += (yearlyBirths[y] * role.multiplier);
    }

    // Calculate the fractional portion of the final year
    // E.g., June 15th means we only add ~45% of that specific year's total
    const startOfYear = new Date(targetYear, 0, 1);
    const msInYear = 1000 * 60 * 60 * 24 * 365.25; 
    const timePassedInYear = targetDate - startOfYear;
    const fractionOfYear = timePassedInYear / msInYear;

    totalRank += (yearlyBirths[targetYear] * role.multiplier * fractionOfYear);

    return Math.floor(totalRank); // Return a clean integer
}

// =========================================
// 4. THE UI & ANIMATIONS
// =========================================

// The Ridiculous Loading Steps
const loadingPhrases = [
    "Interpolating decadal population curves...",
    "Executing summation loops against historical bounds...",
    "Adjusting for seasonal birthrate variances...",
    "Isolating exact fractional year quotients...",
    "Resolving demographic matrix..."
];

function shootConfetti() {
    const defaults = { zIndex: 9999 };
    confetti(Object.assign({}, defaults, { particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 1 } }));
    confetti(Object.assign({}, defaults, { particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 1 } }));
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        const currentNumber = Math.floor(easeOutProgress * (end - start) + start);
        
        obj.innerHTML = currentNumber.toLocaleString('en-GB');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toLocaleString('en-GB');
            shootConfetti(); 
        }
    };
    window.requestAnimationFrame(step);
}

function startCalculation() {
    const dateInput = document.getElementById('statusDate').value;
    const selectedRole = document.getElementById('roleSelect').value;
    
    if (!dateInput) {
        alert("Please enter a valid date and time.");
        return;
    }

    const statusDate = new Date(dateInput);
    
    // Run our new time-machine calculation
    const calculatedRanking = performAccurateCalculation(statusDate, selectedRole);
    if (!calculatedRanking) return; // Stop if they picked a date before 1900

    const roleTitle = roleStats[selectedRole].title;

    // UI Updates
    document.getElementById('calcButton').style.display = 'none';
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('loadingArea').style.display = 'block';
    
    const loadingTextElement = document.getElementById('loadingText');
    let step = 0;

    const loadingInterval = setInterval(() => {
        if (step < loadingPhrases.length) {
            loadingTextElement.innerText = loadingPhrases[step];
            step++;
        } else {
            clearInterval(loadingInterval);
            document.getElementById('loadingArea').style.display = 'none';
            document.getElementById('resultArea').style.display = 'block';
            
            document.getElementById('rankingDisplay').innerHTML = `You are ${roleTitle} #<span id="numberAnim">0</span>`;
            animateValue(document.getElementById('numberAnim'), 0, calculatedRanking, 1500);

            // Update Zazzle URL
            const zazzleBaseUrl = "https://www.zazzle.co.uk/not_number_one_mug-256835584163265070?r=7632979&ed=True";
            const mugText = encodeURIComponent(`#${calculatedRanking.toLocaleString('en-GB')} ${roleTitle}`);
            document.getElementById('mugLink').href = `${zazzleBaseUrl}&t_rankingtext_txt=${mugText}`;
            
            document.getElementById('calcButton').style.display = 'block';
        }
    }, 600);
}

// =========================================
// 5. MODAL CONTROLS
// =========================================
function openModal(modalId, event) {
    event.preventDefault(); 
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
}

// =========================================
// 6. NATIVE SHARE LOGIC (WITH LOCALHOST SAFETY)
// =========================================
async function shareResult() {
    const roleTitle = document.getElementById('roleSelect').options[document.getElementById('roleSelect').selectedIndex].text;
    const rankElement = document.getElementById('numberAnim');
    
    if (!rankElement) return; 
    
    const rankNumber = rankElement.innerText;
    const currentUrl = window.location.href;
    
    const shareData = {
        title: 'The Historical Reality Check',
        text: `I've just been officially audited. I am ${roleTitle} #${rankNumber} in human history. Find your actual place in line:`,
        url: currentUrl
    };

    // SAFETY CHECK: Is this running on a local testing server or a desktop PC?
    const isLocal = currentUrl.startsWith('http://127.0.0.1') || currentUrl.startsWith('http://localhost') || currentUrl.startsWith('file:');
    
    // Some desktop browsers claim to support navigator.share but crash on local URLs. 
    // If we are local, we force the clipboard fallback.
    if (navigator.share && !isLocal) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('User cancelled share or error occurred:', err);
        }
    } else {
        // FALLBACK: Copy to clipboard
        const clipboardText = `${shareData.text} ${shareData.url}`;
        navigator.clipboard.writeText(clipboardText).then(() => {
            alert("Results copied to clipboard! Paste it into your group chat.");
        }).catch(err => {
            alert("Please copy the URL at the top of your screen to share!");
        });
    }
}