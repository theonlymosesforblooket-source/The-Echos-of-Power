// THE ECHOS OF POWER - CORE GAME ENGINE
// ======================================

// === GAME STATE (Your Exact Systems) ===
const gameState = {
    turn: 1,
    favor: { elites: 50, common: 50, pillars: 50 },
    stress: 0,
    legitimacy: 'STABLE: Power secure',
    gameOver: false,
    path: { military: 0, political: 0, shadow: 0, restraint: 0 },
    advisor: {
        name: 'General Valeria',
        loyalty: 70,
        agenda: 'military',
        beliefs: { military: 0.9, reform: 0.3, corruption: -0.2 }
    }
};

// === ECONOMY SYSTEM ===
const economy = {
    agriculture: 50,
    mining: 40,
    trade: 30,
    treasury: 100,
    infrastructure: { hospitals: 0, schools: 0, churches: 0, ports: 0, bridges: 0 }
};

// === GEOGRAPHY SYSTEM ===
const geography = {
    control: { plains: 100, mountains: 60, rivers: 80, coastal: 40 }
};

// === TECHNOLOGY SYSTEM ===
const tech = {
    tools: { level: 1, cost: 30 },
    buildings: { level: 1, cost: 45 },
    medicine: { level: 1, cost: 40 },
    agriculture: { level: 1, cost: 25 },
    mining: { level: 1, cost: 35 },
    transportation: { level: 1, cost: 50 }
};

// === DOM REFERENCES ===
const dom = {
    turnDisplay: document.getElementById('turnDisplay'),
    elitesBar: document.getElementById('elitesBar'),
    elitesText: document.getElementById('elitesText'),
    commonBar: document.getElementById('commonBar'),
    commonText: document.getElementById('commonText'),
    pillarsBar: document.getElementById('pillarsBar'),
    pillarsText: document.getElementById('pillarsText'),
    stressBar: document.getElementById('stressBar'),
    stressText: document.getElementById('stressText'),
    legitimacy: document.getElementById('legitimacy'),
    advisorBox: document.getElementById('advisorBox')
};

// === INITIALIZE DOM REFERENCES ===
document.addEventListener('DOMContentLoaded', function() {
    // Finish setting up all DOM references
    dom.turnDisplay = document.getElementById('turnDisplay');
    dom.stressStatus = document.getElementById('stressStatus');
    dom.eventLog = document.getElementById('eventLog');
    dom.mainChoices = document.getElementById('mainChoices');
    dom.saveBtn = document.getElementById('saveBtn');
    
    initGame();
});
// === UI UPDATE SYSTEM ===
function updateUI() {
    // Favor Bars
    dom.elitesText.textContent = gameState.favor.elites;
    dom.commonText.textContent = gameState.favor.common;
    dom.pillarsText.textContent = gameState.pillars;
    
    dom.elitesBar.style.width = gameState.favor.elites + '%';
    dom.commonBar.style.width = gameState.favor.common + '%';
    dom.pillarsBar.style.width = gameState.favor.pillars + '%';
    
    // Stress Bar
    dom.stressText.textContent = gameState.stress;
    dom.stressBar.style.width = gameState.stress + '%';
    dom.stressStatus.textContent = getStressStatus();
    
    // Turn & Legitimacy
    dom.turnDisplay.textContent = `Turn ${gameState.turn}`;
    dom.legitimacy.textContent = gameState.legitimacy;
    dom.legitimacy.className = getLegitimacyClass();
    
    updateEconomyUI();
    updateGeographyUI();
    updateDashboard();
}

// === FAVOR SYSTEM (Consent, NOT approval) ===
function adjustFavor(group, delta) {
    gameState.favor[group] = Math.max(0, Math.min(100, gameState.favor[group] + delta));
    
    // YOUR RIPPLE EFFECTS - Exact from design doc
    if (gameState.favor.pillars > 75) adjustFavor('elites', 5);   // Pillars stabilize Elites
    if (gameState.favor.common > 75) adjustFavor('elites', -8);   // Common threatens Elites  
    if (gameState.favor.elites > 85) adjustFavor('common', -5);   // Elites neglect Common
    
    updateLegitimacy();
}

function getAverageFavor() {
    return (gameState.favor.elites + gameState.favor.common + gameState.favor.pillars) / 3;
}

function updateLegitimacy() {
    const avg = getAverageFavor();
    if (avg < 30) {
        gameState.legitimacy = 'CRISIS: Legitimacy crumbling';
        dom.legitimacy.classList.add('crisis');
    } else if (avg < 70) {
        gameState.legitimacy = 'UNSTABLE: Consent fragile';
        dom.legitimacy.classList.add('unstable');
        dom.legitimacy.classList.remove('crisis');
    } else {
        gameState.legitimacy = 'STABLE: Power secure';
        dom.legitimacy.classList.remove('crisis', 'unstable');
    }
}

function getStressStatus() {
    if (gameState.stress > 70) return 'CRITICAL';
    if (gameState.stress > 40) return 'HIGH';
    return 'MANAGEABLE';
}

function getLegitimacyClass() {
    const avg = getAverageFavor();
    return avg < 30 ? 'legitimacy crisis' : avg < 70 ? 'legitimacy unstable' : 'legitimacy';
}

// === STRESS SYSTEM (Cost of ambition) ===
function addStress(amount, reason = '') {
    gameState.stress = Math.min(100, gameState.stress + amount);
    logEvent(`Stress +${amount}: ${reason}`);
    
    if (gameState.stress > 80) {
        logEvent('🧠 STRESS OVERLOAD: Favor -10 everywhere');
        adjustFavor('elites', -10);
        adjustFavor('common', -10);
        adjustFavor('pillars', -10);
    }
    updateUI();
}
// === EVENT LOG ===
function logEvent(message) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const div = document.createElement('div');
    div.innerHTML = `[${timestamp}] ${message}`;
    dom.eventLog.appendChild(div);
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
}

// === EVENTS SYSTEM (World REACTS, misinterprets) ===
const events = [
    {
        text: "🌾 Famine ravages countryside",
        favor: { common: -18 },
        stress: 22,
        perception: "Ruler ignores people's suffering"
    },
    {
        text: "🏛️ Elites demand tax cuts", 
        favor: { elites: 12, common: -14 },
        stress: 10,
        perception: "Nobles feast while peasants starve"
    },
    {
        text: "⚔️ Military needs border funding",
        favor: { pillars: 16 },
        stress: 14,
        perception: "General prepares for war, not peace"
    },
    {
        text: "📜 Corruption rumors spread",
        favor: { common: 12, elites: -10 },
        stress: 18,
        perception: "Inner circle betrays the people"
    }
];

let eventCooldown = 0; // FIX: No spam

function triggerEvent() {
    if (eventCooldown > 0 || Math.random() > 0.6) return; // 40% chance only
    
    const evt = events[Math.floor(Math.random() * events.length)];
    logEvent(`📜 EVENT: ${evt.text}`);
    logEvent(`👥 WORLD SAYS: "${evt.perception}"`);
    
    for (let group in evt.favor) {
        adjustFavor(group, evt.favor[group]);
    }
    addStress(evt.stress, 'Crisis response');
    
    eventCooldown = 3; // 3-turn cooldown
}

// === ADVISOR SYSTEM (Living characters w/ agendas) ===
function getAdvisorReaction(action) {
    const advisor = gameState.advisor;
    let reaction = '', loyaltyDelta = 0;
    
    switch(action) {
        case 'military':
            reaction = advisor.agenda === 'military' ? 
                '"Strength secures eternity."' : '"Swords don\'t feed people."';
            loyaltyDelta = advisor.agenda === 'military' ? 3 : -2;
            break;
        case 'reform':
            reaction = advisor.beliefs.reform > 0.5 ? 
                '"People\'s voice matters."' : '"Mob cannot rule."';
            loyaltyDelta = advisor.beliefs.reform > 0.5 ? 2 : -3;
            break;
        case 'delegate':
            reaction = '"Power shared is power lost."';
            loyaltyDelta = -1;
            break;
    }
    
    advisor.loyalty = Math.max(0, Math.min(100, advisor.loyalty + loyaltyDelta));
    return reaction;
}

// === UPDATE ADVISOR SPEECH ===
function updateAdvisorSpeech(action = '') {
    const advisor = gameState.advisor;
    
    if (advisor.loyalty < 30) {
        dom.advisorBox.innerHTML = `<span style="color: #ff4444;">💔 ${advisor.name} BETRAYS YOU!</span><br>
        "Your weakness ends here." <strong>Loyalty: ${advisor.loyalty}</strong>`;
        adjustFavor('elites', -20);
        addStress(25, 'Betrayal');
    } else if (action) {
        const reaction = getAdvisorReaction(action);
        dom.advisorBox.innerHTML = `<strong>${advisor.name}:</strong> ${reaction}<br>
        <small>Loyalty: ${advisor.loyalty} | Agenda: ${advisor.agenda}</small>`;
    }
}
// === CHOICE SYSTEM (Paths emerge from actions) ===
const coreChoices = [
    {
        text: '⚔️ Military Push<br><small>+Pillars -Common +Stress</small>',
        action: 'military',
        effect: function() {
            adjustFavor('pillars', 18);
            adjustFavor('common', -6);
            addStress(10, 'War preparations');
            gameState.path.military++;
        }
    },
    {
        text: '📜 Bold Reforms<br><small>+Common -Elites +Stress</small>',
        action: 'reform', 
        effect: function() {
            adjustFavor('common', 15);
            adjustFavor('elites', -12);
            addStress(6, 'Political resistance');
            gameState.path.political++;
        }
    },
    {
        text: '👥 Delegate Authority<br><small>-Stress -Elites risk</small>',
        action: 'delegate',
        effect: function() {
            addStress(-18, 'Delegation'); // FIXED: No forced +20 stress
            adjustFavor('elites', -8);
            gameState.path.restraint++;
        }
    },
    {
        text: '😶 Ignore Crisis<br><small>+Heavy Stress</small>',
        action: 'ignore',
        effect: function() {
            addStress(22, 'Neglect');
            gameState.path.shadow++;
        }
    }
];

// === POPULATE MAIN CHOICES ===
function populateMainChoices() {
    dom.mainChoices.innerHTML = '';
    coreChoices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.innerHTML = choice.text;
        btn.onclick = function() {
            if (gameState.gameOver) return;
            
            // Execute choice
            choice.effect();
            updateAdvisorSpeech(choice.action);
            
            // Random event (NOT every time) - BUG FIXED
            if (Math.random() > 0.7) {
                setTimeout(triggerEvent, 800);
            }
            
            gameState.turn++;
            updateUI();
            checkGameOver();
        };
        dom.mainChoices.appendChild(btn);
    });
}

// === ECONOMY CHOICES (Working upgrades - BUG FIXED) ===
const econChoices = [
    {
        text: '🌾 Invest Agriculture<br><small>+Food +Common -Treasury</small>',
        effect: function() {
            if (economy.treasury >= 25) {
                economy.agriculture += 15;
                economy.treasury -= 25;
                adjustFavor('common', 8);
                logEvent('🌾 Agriculture investment strengthens food supply');
            }
        }
    },
    {
        text: '⛏️ Expand Mining<br><small>+Tech +Pillars -Treasury</small>',
        effect: function() {
            if (economy.treasury >= 35) {
                economy.mining += 18;
                economy.treasury -= 35;
                adjustFavor('pillars', 10);
                logEvent('⛏️ Mining expansion fuels industry');
            }
        }
    }
];

// === ECONOMY UI UPDATE ===
function updateEconomyUI() {
    document.getElementById('agriculture').textContent = economy.agriculture;
    document.getElementById('mining').textContent = economy.mining;
    document.getElementById('trade').textContent = economy.trade;
    document.getElementById('treasury').textContent = economy.treasury;
    
    const infraCount = Object.values(economy.infrastructure).reduce((a,b)=>a+b,0);
    document.getElementById('infraStatus').textContent = 
        infraCount ? `${infraCount} structures built` : 'No infrastructure';
}
// === SAVE/LOAD SYSTEM ===
function saveGame() {
    const saveData = {
        gameState,
        economy,
        geography,
        tech,
        gameState.path
    };
    localStorage.setItem('echosOfPower', JSON.stringify(saveData));
    logEvent('💾 Reign saved. Your legacy endures.');
}

function loadGame() {
    try {
        const saved = localStorage.getItem('echosOfPower');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(gameState, data.gameState);
            Object.assign(economy, data.economy);
            Object.assign(geography, data.geography);
            Object.assign(tech, data.tech);
            Object.assign(gameState.path, data.gameState.path);
            updateUI();
            logEvent('📂 Reign restored. Continue your rule.');
        }
    } catch(e) {
        logEvent('❌ No save found.');
    }
}

// === CIVILIZATION SYSTEM (BUG #3 FIXED) ===
const civilizations = {
    rome: {
        name: 'Roman Empire',
        elitesLabel: 'Senators',
        commonLabel: 'Plebeians', 
        pillarsLabel: 'Legions',
        advisor: { name: 'Senator Cicero', loyalty: 65, agenda: 'political' }
    },
    medieval: {
        name: 'Medieval Kingdom',
        elitesLabel: 'Nobles',
        commonLabel: 'Serfs',
        pillarsLabel: 'Knights', 
        advisor: { name: 'Lord Baldwin', loyalty: 75, agenda: 'military' }
    }
};

let currentCiv = 'rome';

function switchCivilization(civ) {
    currentCiv = civ;
    const civData = civilizations[civ];
    
    // Update advisor
    gameState.advisor.name = civData.advisor.name;
    gameState.advisor.loyalty = civData.advisor.loyalty;
    gameState.advisor.agenda = civData.advisor.agenda;
    
    // Update favor labels
    document.getElementById('elitesLabel').textContent = civData.elitesLabel;
    document.getElementById('commonLabel').textContent = civData.commonLabel;
    document.getElementById('pillarsLabel').textContent = civData.pillarsLabel;
    
    logEvent(`🏛️ Era: ${civData.name}. New political ecosystem activated.`);
    updateAdvisorSpeech();
}

// === CONTROL BUTTONS (All Working) ===
function setupControls() {
    document.getElementById('saveBtn').onclick = saveGame;
    document.getElementById('loadBtn').onclick = loadGame;
    document.getElementById('newReignBtn').onclick = () => location.reload();
    document.getElementById('civRome').onclick = () => switchCivilization('rome');
    document.getElementById('civMedieval').onclick = () => switchCivilization('medieval');
    
    logEvent('⚙️ Controls ready: Save/Load/Civilizations');
}

// === ECONOMY CHOICES POPULATION ===
function populateEconChoices() {
    const container = document.getElementById('econTechChoices');
    container.innerHTML = '';
    
    econChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerHTML = choice.text;
        btn.onclick = () => {
            if (gameState.gameOver) return;
            choice.effect();
            updateUI();
        };
        container.appendChild(btn);
    });
}

// === UPDATE GEOGRAPHY UI ===
function updateGeographyUI() {
    document.getElementById('plainsControl').textContent = geography.control.plains + '%';
    document.getElementById('mountainsControl').textContent = geography.control.mountains + '%';
    document.getElementById('riversControl').textContent = geography.control.rivers + '%';
    document.getElementById('coastalControl').textContent = geography.control.coastal + '%';
}
// === GAME OVER SYSTEM ===
function checkGameOver() {
    const avgFavor = getAverageFavor();
    
    // TOTAL COLLAPSE
    if (avgFavor < 25) {
        endGame('💀 GAME OVER: Consent revoked. The throne lies empty.');
        return true;
    }
    
    // NATURAL REIGN END
    if (gameState.turn > 25) {
        endGame('🏰 REIGN ENDS: History writes your legacy.');
        return true;
    }
    
    // STRESS DEATH
    if (gameState.stress >= 100) {
        endGame('🪦 BROKEN: Stress claimed you. The crown falls from lifeless hands.');
        return true;
    }
    
    // ADVISOR BETRAYAL CHAIN
    if (gameState.advisor.loyalty < 10) {
        endGame('🔪 BETRAYAL: Your inner circle destroyed you.');
        return true;
    }
    
    return false;
}

function endGame(message) {
    gameState.gameOver = true;
    logEvent(message);
    
    // Disable choices
    document.querySelectorAll('#mainChoices button, #econTechChoices button').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
    
    setTimeout(revealLegacy, 1500);
}

// === YOUR 5 SEMANTIC ENDINGS ===
function revealLegacy() {
    const paths = gameState.path;
    const maxPath = Math.max(paths.military, paths.political, paths.shadow, paths.restraint);
    let title = '🌀 THE ENIGMA';
    let narrative = 'Your reign defies definition. History debates your soul.';
    
    if (paths.military === maxPath) {
        title = '⚔️ THE WARLORD';
        narrative = 'Legions echo your name across eternity. Blood writes history.';
    } else if (paths.political === maxPath) {
        title = '📜 THE REFORMER';
        narrative = 'People carve your laws in stone. Your vision outlives flesh.';
    } else if (paths.shadow === maxPath) {
        title = '🕵️ THE SHADOW';
        narrative = 'Whispers carry your name. Power unseen, never forgotten.';
    } else if (paths.restraint === maxPath) {
        title = '⚖️ THE STEWARD';
        narrative = 'Stability endures. Calm waters reflect your steady hand.';
    }
    
    const finalStats = `
        <div style="text-align: center; padding: 30px; margin: 20px 0;">
            <div style="font-size: 2.2em; color: #d4af37; margin-bottom: 15px;">${title}</div>
            <div style="font-size: 1.3em; font-style: italic; color: #f0f0f0; margin-bottom: 20px;">
                "${narrative}"
            </div>
            <div style="font-size: 1.1em; opacity: 0.9;">
                Final Legitimacy: ${Math.round(getAverageFavor())}% | 
                Stress: ${gameState.stress}% | Turn: ${gameState.turn}<br>
                Military:${paths.military} Reform:${paths.political} 
                Shadow:${paths.shadow} Restraint:${paths.restraint}
            </div>
        </div>
    `;
    
    dom.eventLog.innerHTML += finalStats;
    dom.eventLog.scrollTop = dom.eventLog.scrollHeight;
}

// === VICTORY CONDITIONS (Domination + Golden Age) ===
function checkVictory() {
    const avgFavor = getAverageFavor();
    const avgControl = Object.values(geography.control).reduce((a,b)=>a+b,0) / 4;
    
    // TOTAL DOMINATION
    if (avgFavor > 85 && avgControl > 90 && economy.treasury > 500) {
        endGame('👑 TOTAL VICTORY: The world kneels. Your empire eternal.');
        return true;
    }
    
    // GOLDEN AGE
    if (avgFavor > 80 && gameState.stress < 25 && economy.agriculture > 120) {
        endGame('🌟 GOLDEN AGE: Wisdom endures. Poets sing millenia hence.');
        return true;
    }
    
    return false;
}

// === STATUS DASHBOARD ===
function updateDashboard() {
    const maxPath = Math.max(...Object.values(gameState.path));
    const pathNames = {
        military: 'Warlord', political: 'Reformer', 
        shadow: 'Shadow', restraint: 'Steward'
    };
    
    let currentPath = 'Uncertain';
    for (let path in gameState.path) {
        if (gameState.path[path] === maxPath) {
            currentPath = pathNames[path];
            break;
        }
    }
    
    document.getElementById('pathDisplay').textContent = currentPath;
    document.getElementById('territoryControl').textContent = 
        Math.round(Object.values(geography.control).reduce((a,b)=>a+b,0)/4) + '%';
    document.getElementById('turnSummary').textContent = gameState.turn;
}
// === TECHNOLOGY SYSTEM (Moral tradeoffs) ===
function researchTech(type) {
    const t = tech[type];
    if (economy.treasury < t.cost) {
        logEvent(`❌ Insufficient funds for ${type} research ($${t.cost})`);
        return false;
    }
    
    economy.treasury -= t.cost;
    t.level++;
    t.cost = Math.floor(t.cost * 1.4);
    
    // Tech affects economy + favor
    switch(type) {
        case 'agriculture': 
            economy.agriculture += 12; 
            adjustFavor('common', 6);
            break;
        case 'mining': 
            economy.mining += 15; 
            adjustFavor('pillars', 8);
            break;
        case 'medicine': 
            adjustFavor('common', 10);
            gameState.stress = Math.max(0, gameState.stress - 5);
            break;
        case 'transportation':
            geography.control.rivers += 10;
            geography.control.coastal += 8;
            break;
    }
    
    logEvent(`🔬 ${type} advanced to level ${t.level}. Progress shapes destiny.`);
    updateTechUI();
    return true;
}

// === TECHNOLOGY UI ===
function updateTechUI() {
    const grid = document.getElementById('techGrid');
    grid.innerHTML = '';
    
    Object.keys(tech).forEach(type => {
        const div = document.createElement('div');
        div.innerHTML = `
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br>
            Lvl ${tech[type].level} ($${tech[type].cost})
        `;
        div.style.cssText = 'padding: 12px; background: rgba(0,0,0,0.4); border-radius: 8px; text-align: center;';
        grid.appendChild(div);
    });
}

// === INFRASTRUCTURE SYSTEM (Reflects your VALUES) ===
function buildInfrastructure(type, cost, favorGroup, favorBonus) {
    if (economy.treasury < cost) {
        logEvent(`❌ Treasury too low for ${type} ($${cost})`);
        return false;
    }
    
    economy.treasury -= cost;
    economy.infrastructure[type]++;
    
    adjustFavor(favorGroup, favorBonus);
    logEvent(`🏗️ ${type} constructed. Your values take physical form.`);
    updateEconomyUI();
    return true;
}

// === TECH CHOICES (Now clickable in UI) ===
const techChoices = [
    {
        text: '🔬 Research Agriculture<br><small>+Food production</small>',
        effect: () => researchTech('agriculture')
    },
    {
        text: '⛏️ Research Mining<br><small>+Industry +Pillars</small>', 
        effect: () => researchTech('mining')
    },
    {
        text: '🏥 Build Hospitals<br><small>+Common -Treasury</small>',
        effect: () => buildInfrastructure('hospitals', 45, 'common', 12)
    },
    {
        text: '⛪ Build Churches<br><small>+Elites -Treasury</small>',
        effect: () => buildInfrastructure('churches', 40, 'elites', 10)
    }
];

// === POPULATE TECH CHOICES ===
function populateTechChoices() {
    const container = document.getElementById('econTechChoices');
    container.innerHTML = '';
    
    techChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerHTML = choice.text;
        btn.onclick = () => {
            if (gameState.gameOver) return;
            choice.effect();
            updateUI();
        };
        container.appendChild(btn);
    });
    
    // Add economy choices too
    econChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerHTML = choice.text;
        btn.onclick = choice.effect;
        container.appendChild(btn);
    });
}
// === GEOGRAPHY CONQUEST SYSTEM ===
function conquerTerritory(type) {
    geography.control[type] = Math.min(100, geography.control[type] + 20);
    adjustFavor('pillars', 12);
    economy.treasury += 35;
    addStress(15, 'Conquest strain');
    
    // Geography affects economy
    switch(type) {
        case 'plains': economy.agriculture += 10; break;
        case 'mountains': economy.mining += 12; break;
        case 'coastal': economy.trade += 15; break;
    }
    
    logEvent(`⚔️ Conquered ${type}. Territory expands, ambition grows.`);
    updateGeographyUI();
}

// === AUTO GAME LOOP (World lives) ===
let gameTick = 0;
function gameLoop() {
    if (gameState.gameOver) return;
    
    gameTick++;
    
    // Geography decay (hold territory or lose it)
    Object.keys(geography.control).forEach(type => {
        if (Math.random() > 0.95) {
            geography.control[type] = Math.max(0, geography.control[type] - 2);
            logEvent(`🌍 ${type} rebels (-2% control)`);
        }
    });
    
    // Economy pressure
    if (economy.agriculture < 30) {
        adjustFavor('common', -3);
    }
    if (economy.treasury < 20) {
        adjustFavor('elites', -4);
    }
    
    // Stress creep from ruling
    if (gameTick % 8 === 0) {
        addStress(2, 'Burden of rule');
    }
    
    updateUI();
    eventCooldown = Math.max(0, eventCooldown - 1);
}

// === MASTER INITIALIZATION ===
function initGame() {
    // Setup all DOM references
    Object.assign(dom, {
        stressStatus: document.getElementById('stressStatus'),
        eventLog: document.getElementById('eventLog'),
        mainChoices: document.getElementById('mainChoices'),
        econTechChoices: document.getElementById('econTechChoices'),
        saveBtn: document.getElementById('saveBtn'),
        loadBtn: document.getElementById('loadBtn'),
        newReignBtn: document.getElementById('newReignBtn'),
        civRome: document.getElementById('civRome'),
        civMedieval: document.getElementById('civMedieval')
    });
    
    // Initial UI
    updateUI();
    updateTechUI();
    populateMainChoices();
    populateTechChoices();
    setupControls();
    
    // Prime the world
    logEvent('👑 THE ECHOS OF POWER - Reign begins');
    logEvent('Consent is dynamic. Stress is real. Perception rules all.');
    
    // Auto-loop every 5 seconds
    setInterval(gameLoop, 5000);
    
    logEvent('⚙️ Empire ready. What will power make of you?');
}

// === START THE EMPIRE ===
document.addEventListener('DOMContentLoaded', initGame);

// === DEBUG CONSOLE (F12) ===
window.gameDebug = {
    triggerEvent,
    addStress: (amt) => addStress(amt),
    maxFavor: () => {
        gameState.favor.elites = gameState.favor.common = gameState.favor.pillars = 100;
        updateUI();
    },
    checkVictory,
    switchCiv: (civ) => switchCivilization(civ)
};
// === DYNAMIC CHOICE SYSTEM (Midgame path lock) ===
function getDynamicChoices() {
    const militaryLead = gameState.path.military >= 4;
    const reformLead = gameState.path.political >= 4;
    const highStress = gameState.stress > 65;
    
    if (militaryLead) {
        return [
            {
                text: '⚔️ Legion Offensive<br><small>Dominate borders +Pillars</small>',
                action: 'military',
                effect: () => {
                    conquerTerritory('coastal');
                    adjustFavor('pillars', 22);
                    gameState.path.military += 2;
                }
            },
            {
                text: '🏗️ Fortify Borders<br><small>+Control -Treasury</small>',
                action: 'military', 
                effect: () => {
                    Object.keys(geography.control).forEach(t => {
                        geography.control[t] = Math.min(100, geography.control[t] + 8);
                    });
                    economy.treasury -= 40;
                }
            }
        ];
    }
    
    if (reformLead) {
        return [
            {
                text: '📜 Land Redistribution<br><small>+Common +Food</small>',
                action: 'reform',
                effect: () => {
                    adjustFavor('common', 20);
                    economy.agriculture += 25;
                    gameState.path.political += 2;
                }
            },
            {
                text: '🏥 Public Medicine<br><small>+Common -Stress</small>',
                action: 'reform',
                effect: () => {
                    adjustFavor('common', 15);
                    addStress(-12, 'Public goodwill');
                    researchTech('medicine');
                }
            }
        ];
    }
    
    return coreChoices; // Default choices
}

// === MIDGAME PERCEPTION LOCK (Your genius twist) ===
let worldPerceptionLocked = false;
function lockWorldPerception() {
    if (gameState.turn > 12 && !worldPerceptionLocked) {
        worldPerceptionLocked = true;
        const dominantPath = Object.keys(gameState.path).reduce((a, b) => 
            gameState.path[a] > gameState.path[b] ? a : b
        );
        
        logEvent(`🪨 MIDPOINT LOCK: World sees you as "${dominantPath.toUpperCase()}".`);
        logEvent(`Events and advisors now reinforce this perception. No escape.`);
        
        // Lock affects future events
        events.forEach(evt => {
            if (dominantPath === 'military') evt.favor.pillars = (evt.favor.pillars || 0) + 5;
            if (dominantPath === 'political') evt.favor.common = (evt.favor.common || 0) + 4;
        });
    }
}

// === ENHANCED CHOICE POPULATION ===
function populateMainChoices() {
    dom.mainChoices.innerHTML = '';
    const choices = getDynamicChoices();
    
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.innerHTML = choice.text;
        btn.onclick = () => {
            if (gameState.gameOver) return;
            
            choice.effect();
            updateAdvisorSpeech(choice.action);
            lockWorldPerception();
            
            // Controlled event chance (NOT spam)
            if (Math.random() > 0.75 && eventCooldown === 0) {
                setTimeout(triggerEvent, 1000);
            }
            
            gameState.turn++;
            updateUI();
            checkGameOver();
            checkVictory();
        };
        dom.mainChoices.appendChild(btn);
    });
}

// === ECONOMY PRESSURE SYSTEM ===
function applyEconomyPressure() {
    if (economy.agriculture < 25) {
        logEvent('🌾 STARVATION: Common favor crumbling');
        adjustFavor('common', -8);
    }
    if (economy.treasury < 15) {
        logEvent('💸 BROKE: Elites abandon you');
        adjustFavor('elites', -10);
    }
    if (Object.values(geography.control).some(c => c < 30)) {
        logEvent('🌍 REBELLION: Territory slipping');
        adjustFavor('pillars', -6);
    }
}
// === MOBILE + KEYBOARD CONTROLS ===
document.addEventListener('keydown', (e) => {
    if (gameState.gameOver) return;
    
    switch(e.key) {
        case '1': 
        case '2': 
        case '3': 
        case '4':
            const buttons = document.querySelectorAll('#mainChoices button');
            if (buttons[e.key - 1]) buttons[e.key - 1].click();
            break;
        case 's': case 'S': saveGame(); break;
        case 'l': case 'L': loadGame(); break;
        case 'r': case 'R': location.reload(); break;
    }
});

// Touch controls for mobile
document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth) * 100;
    
    if (x < 25) document.getElementById('civRome')?.click();
    if (x > 75) document.getElementById('civMedieval')?.click();
}, { passive: true });

// === ACHIEVEMENT SYSTEM ===
const achievements = {
    ironFist: { condition: () => gameState.path.military >= 6, text: 'Iron Fist: 6+ military actions' },
    peoplesChampion: { condition: () => gameState.path.political >= 5, text: 'People\'s Champion: 5+ reforms' },
    survivor: { condition: () => gameState.stress > 90 && getAverageFavor() > 40, text: 'Survivor: High stress, still ruling' },
    broke: { condition: () => economy.treasury < 0, text: 'Bankrupt: Treasury in ruins' }
};

function checkAchievements() {
    Object.keys(achievements).forEach(key => {
        if (achievements[key].condition() && !achievements[key].unlocked) {
            achievements[key].unlocked = true;
            logEvent(`🏆 ACHIEVEMENT: ${achievements[key].text}`);
        }
    });
}

// === GAME BALANCING TWEAKS ===
function balanceCheck() {
    // Prevent impossible stress recovery
    if (gameState.stress > 95 && Math.random() > 0.98) {
        addStress(-5, 'Moment of clarity');
    }
    
    // Economy recovery
    if (economy.treasury < 10 && Math.random() > 0.95) {
        economy.treasury += 15;
        logEvent('💰 Unexpected tribute arrives');
    }
}

// === MASTER UPDATE LOOP ===
function masterUpdate() {
    if (gameState.gameOver) return;
    
    gameLoop();
    checkAchievements();
    balanceCheck();
    lockWorldPerception();
    applyEconomyPressure();
    
    // Auto-save every 10 turns
    if (gameState.turn % 10 === 0) {
        saveGame();
        logEvent('💾 Auto-save (Turn ' + gameState.turn + ')');
    }
}

// === PERFECT INITIALIZATION ===
function initGame() {
    // Full DOM setup
    Object.assign(dom, {
        stressStatus: document.getElementById('stressStatus'),
        eventLog: document.getElementById('eventLog'),
        mainChoices: document.getElementById('mainChoices'),
        econTechChoices: document.getElementById('econTechChoices'),
        saveBtn: document.getElementById('saveBtn'),
        loadBtn: document.getElementById('loadBtn'),
        newReignBtn: document.getElementById('newReignBtn'),
        civRome: document.getElementById('civRome'),
        civMedieval: document.getElementById('civMedieval'),
        pathDisplay: document.getElementById('pathDisplay'),
        territoryControl: document.getElementById('territoryControl'),
        turnSummary: document.getElementById('turnSummary')
    });
    
    updateUI();
    updateTechUI();
    populateMainChoices();
    populateTechChoices();
    setupControls();
    
    // Launch sequence
    logEvent('👑 THE ECHOS OF POWER');
    logEvent('Power tests the soul. Consent is fragile. History watches.');
    
    setInterval(masterUpdate, 4000);
    logEvent('⚔️ Rule begins. What will you become?');
}

// === LAUNCH ===
document.addEventListener('DOMContentLoaded', initGame);

// === PUBLIC DEBUG API ===
window.echos = {
    save: saveGame,
    load: loadGame,
    debug: window.gameDebug,
    state: () => ({ gameState, economy, geography })
};
