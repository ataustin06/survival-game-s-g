export default class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }
    preload() {
    }
    create() {
        this.cameras.main.setBackgroundColor('#7fcf7a');
        const urlParams = new URLSearchParams(window.location.search);
        this.qualtricsParentOrigin = this.normalizeParentOrigin(urlParams.get('parentOrigin') || '');
        const gameId = urlParams.get('gameId');
        const qualtricsId = urlParams.get('qualtricsId') || urlParams.get('responseId') || urlParams.get('ResponseID') || urlParams.get('participantId');
        const respondentDecileRaw = Number.parseInt(urlParams.get('respondentDecile') || urlParams.get('respondentDecileValue') || '', 10);
        const respondentDecile = respondentDecileRaw >= 1 && respondentDecileRaw <= 10 ? respondentDecileRaw : null;
        const respondentIncomeThird = this.normalizeIncomeThird(urlParams.get('respondentIncomeThird') || urlParams.get('respondentIncomeThirdValue') || '');
        this.requestedSelfInterestCondition = (urlParams.get('selfInterestCondition') || urlParams.get('selfInterestConditionValue') || '').trim().toLowerCase();
        console.log('gameId:', gameId);
        console.log('qualtricsId:', qualtricsId);
        console.log('respondentDecile:', respondentDecile);
        console.log('respondentIncomeThird:', respondentIncomeThird);
        this.gameData = {
            gameId: gameId,
            qualtricsId: qualtricsId,
            condition: 'sufficiency',
            gameVersion: 'sufficiency_english_gini_preferences_v3',
            gameStartTime: new Date().toISOString(),
            gameEndTime: null,
            totalDurationMs: null,
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            isMobile: this.isMobileDevice(),
            screenOrientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
            survivalCheck: null,
            totalFoodEstimate: null,
            perCapitaEstimate: null,
            equalDivisionOutcomeChoice: null,
            equalDivisionOutcomePassed: null,
            totalFoodCountIndividualMoves: 0,
            totalFoodCountPersonDumps: 0,
            equalDivisionIndividualMoves: 0,
            equalDivisionShortcutUsed: false,
            partialRedistributionIndividualMoves: 0,
            partialRedistributionShortcutUsed: false,
            partialRedistributionFinal: {
                personA: 0,
                personB: 0,
                personC: 0
            },
            partialRedistributionSurvivors: null,
            redistributionRulesSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            survivalRedistributionSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            personalRedistributionSelected: {
                noRedistribution: false,
                equalRedistribution: false,
                partialRedistribution: false
            },
            freeAllocationFinal: null,
            freeAllocationGini: null,
            freeAllocationSurvivors: null,
            freeAllocationTotalMoved: null,
            freeAllocationDurationMs: null,
            redistributionFeasibility: null,
            manipulationCheckChoice: null,
            manipulationCheckPassed: null,
            groupDistributionPreference: null,
            partialRedistributionPreference: null,
            distributivePrinciplePriority: null, // Retired duplicate item; retained for export compatibility.
            socialContractGuarantee: null,
            personalVsGroupResponsibility: null,
            fairRuleChoice: null,
            foodRankReminder: null,
            foodPriorityChoice: null,
            workBreakChoice: null,
            floodPreparationChoice: null,
            personDShareChoice: null,
            personDEmpathyChoice: null,
            cooperationCompetitionChoice: null,
            respondentDecile: respondentDecile,
            respondentIncomeThird: respondentIncomeThird,
            respondentRole: this.mapIncomeThirdToPerson(respondentIncomeThird),
            respondentRoleRevealed: false,
            selfInterestCondition: null,
            selfInterestConditionIssue: null,
            selfInterestAllocationFinal: {
                personA: null,
                personB: null,
                personC: null
            },
            selfInterestAllocationSurvivors: null,
            selfInterestAllocationGini: null,
            selfInterestAllocationClassification: null,
            selfInterestAllocationTotalMoved: null,
            selfInterestAllocationMethod: null,
            selfInterestOwnStartingFood: null,
            selfInterestOwnFinalFood: null,
            selfInterestOwnChange: null,
            selfInterestEqualButtonUsed: false,
            selfInterestPartialButtonUsed: false,
            screenTimings: {},
            treeClicks: {
                personA: 0,
                personB: 0,
                personC: 0
            },
            treeFruitCollected: {
                personA: 0,
                personB: 0,
                personC: 0
            },
            equalDivisionFinal: {
                personA: 0,
                personB: 0,
                personC: 0
            },
            saveStatus: null,
            completionMessageSent: false
        };
        this.questionObjects = [];
        this.gameObjects = [];
        this.instructionIndex = 0;
        this.answerButtons = [];
        this.foodCounts = {};
        this.selfInterestEqualApplied = false;
        this.selfInterestPartialApplied = false;
        this.selfInterestAllocationSource = 'starting_distribution';
        this.instructionScreens = [
            'Welcome to the Survival Task. In this task, a group of three people find themselves lost in an otherwise uninhabited location.',
            'The people have been hunting and gathering food in order to survive. \n \nIf a person does not eat at least 5 pieces of food a day, he will not survive. \n \nIf a person collects more than 5 pieces of food a day, he can save the remainder for himself the next day.',
            'The location is rich in natural resources, and the group can always collect enough food for everyone to survive.',
            'Person A usually collects the most pieces of food per day. \n \nPerson B usually collects less than Person A but more than Person C. \n \nPerson C usually collects the least pieces of food per day.',
            'Today, Person A collected 9 pieces of food, Person B collected 6 pieces of food, and Person C collected 3 pieces of food.',
            'You will make decisions about how the group distributes its food. Choose what you think is best for the group. Use only the food shown.'
        ];
        if (this.isMobileDevice()) {
            this.showRotatePhoneScreen(() => {
                this.showInstructionScreen();
            });
        } else {
            this.showInstructionScreen();
        }
    }
    getFixedFoodCounts() {
        return {
            personA: 9,
            personB: 6,
            personC: 3,
            total: 18
        };
    }
    buildSurplusOnlyPartialAllocation() {
        const fixedFood = this.getFixedFoodCounts();
        const threshold = 5;
        const startingAllocation = [
            fixedFood.personA,
            fixedFood.personB,
            fixedFood.personC
        ];
        const allocation = [...startingAllocation];
        const donors = startingAllocation.map((amount, index) => ({
            index,
            surplus: Math.max(0, amount - threshold)
        })).filter(donor => donor.surplus > 0);
        const totalAvailableSurplus = donors.reduce((sum, donor) => sum + donor.surplus, 0);
        const recipients = startingAllocation.map((amount, index) => ({
            index,
            deficit: Math.max(0, threshold - amount),
            startingAmount: amount
        })).filter(recipient => recipient.deficit > 0).sort((left, right) => right.startingAmount - left.startingAmount || left.index - right.index);
        let remainingSurplus = totalAvailableSurplus;
        let totalTransferRequired = 0;
        recipients.forEach(recipient => {
            if (recipient.deficit <= remainingSurplus) {
                allocation[recipient.index] = threshold;
                remainingSurplus -= recipient.deficit;
                totalTransferRequired += recipient.deficit;
            }
        });
        if (totalTransferRequired === 0 || totalAvailableSurplus === 0) {
            return allocation;
        }
        /*
     * Divide the required transfer among donors in
     * proportion to each donor's initial surplus above
     * the survival threshold.
     */
        const contributionShares = donors.map(donor => {
            const exactContribution = donor.surplus / totalAvailableSurplus * totalTransferRequired;
            const baseContribution = Math.floor(exactContribution);
            return {
                ...donor,
                contribution: Math.min(baseContribution, donor.surplus),
                remainder: exactContribution - baseContribution
            };
        });
        let assignedContributions = contributionShares.reduce((sum, donor) => sum + donor.contribution, 0);
        /*
     * Food is measured in whole pieces. Assign any
     * remaining pieces using the largest-remainder method.
     */
        contributionShares.sort((left, right) => right.remainder - left.remainder || right.surplus - left.surplus || left.index - right.index);
        let donorCursor = 0;
        while (assignedContributions < totalTransferRequired) {
            const donor = contributionShares[donorCursor % contributionShares.length];
            if (donor.contribution < donor.surplus) {
                donor.contribution += 1;
                assignedContributions += 1;
            }
            donorCursor += 1;
        }
        contributionShares.forEach(donor => {
            allocation[donor.index] -= donor.contribution;
        });
        return allocation;
    }
    normalizeIncomeThird(incomeThird) {
        const normalized = String(incomeThird).trim().toLowerCase();
        if ([
                'bottom',
                'lower',
                'low',
                '1'
            ].includes(normalized)) {
            return 'bottom';
        }
        if ([
                'middle',
                'mid',
                '2'
            ].includes(normalized)) {
            return 'middle';
        }
        if ([
                'top',
                'upper',
                'high',
                '3'
            ].includes(normalized)) {
            return 'top';
        }
        return null;
    }
    mapIncomeThirdToPerson(incomeThird) {
        const roleByIncomeThird = {
            bottom: 'Person C',
            middle: 'Person B',
            top: 'Person A'
        };
        return roleByIncomeThird[incomeThird] || null;
    }
    normalizeParentOrigin(parentOrigin) {
        try {
            const parsedOrigin = new URL(parentOrigin);
            if (parsedOrigin.protocol !== 'https:' && parsedOrigin.protocol !== 'http:') {
                return null;
            }
            return parsedOrigin.origin;
        } catch (error) {
            return null;
        }
    }
    assignSelfInterestCondition() {
        const validConditions = [
            'reveal',
            'neutral'
        ];
        if (validConditions.includes(this.requestedSelfInterestCondition)) {
            return this.requestedSelfInterestCondition;
        }
        const assignmentId = this.gameData.gameId || this.gameData.qualtricsId;
        const storageKey = assignmentId ? `survivalGameSelfInterest:${ assignmentId }` : null;
        if (storageKey) {
            try {
                const storedCondition = sessionStorage.getItem(storageKey);
                if (validConditions.includes(storedCondition)) {
                    return storedCondition;
                }
            } catch (error) {
            }
        }
        let randomValue = Math.random();
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            randomValue = randomArray[0] / 4294967296;
        }
        const assignedCondition = randomValue < 0.5 ? 'reveal' : 'neutral';
        if (storageKey) {
            try {
                sessionStorage.setItem(storageKey, assignedCondition);
            } catch (error) {
            }
        }
        return assignedCondition;
    }
    isMobileDevice() {
        return window.innerWidth < 900 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    }
    isPortraitMode() {
        return window.innerHeight > window.innerWidth;
    }
    showRotatePhoneScreen(nextFunction) {
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.addQuestionObject(this.add.rectangle(640, 360, 1080, 430, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 310, 'If you are using a cell phone, please rotate your phone sideways to continue.', {
            fontSize: '34px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 900 }
        }).setOrigin(0.5));
        this.createNextButton(640, 520, 'Continue', () => {
            nextFunction.call(this);
        });
    }
    showInstructionScreen() {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1000, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(260, 145, 'Instructions', {
            fontSize: '36px',
            color: '#000000'
        }));
        const instructionStyle = {
            fontSize: '27px',
            color: '#000000',
            wordWrap: { width: 760 },
            lineSpacing: 8
        };
        if (this.instructionIndex === 2) {
            instructionStyle.fontStyle = 'bold';
        }
        this.addQuestionObject(this.add.text(260, 275, this.instructionScreens[this.instructionIndex], instructionStyle));
        this.createNextButton(640, 675, 'Next', () => {
            this.instructionIndex += 1;
            if (this.instructionIndex < this.instructionScreens.length) {
                this.showInstructionScreen();
            } else {
                this.showSurvivalCheckQuestion();
            }
        });
    }
    showSurvivalCheckQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 450, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(250, 175, 'How many pieces of food does each person need to survive the day?', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 780 }
        }));
        const choices = [3, 5, 7];
        if (Phaser.Math.Between(0, 1) === 1) choices.reverse();
        choices.forEach((amount, index) => this.createSurvivalCheckButton(640, 340 + index * 80, amount + ' pieces', amount === 5));

        this.addInstructionReview('', 150, () => { this.instructionIndex = 0; this.showInstructionScreen(); });
    }
    createSurvivalCheckButton(centerX, centerY, label, isCorrect) {
        const paddingX = 24;
        const paddingY = 14;
        const text = this.add.text(centerX, centerY, label, {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        const button = this.add.rectangle(centerX, centerY, text.width + paddingX * 2, text.height + paddingY * 2, 14540253);
        button.setStrokeStyle(2, 0);
        button.setInteractive(new Phaser.Geom.Rectangle(-(button.width + 40) / 2, -(button.height + 30) / 2, button.width + 40, button.height + 30), Phaser.Geom.Rectangle.Contains);
        button.setDepth(1);
        text.setDepth(2);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        button.on('pointerdown', () => {
            this.gameData.survivalCheck = label;
            if (isCorrect) {
                this.showSurvivalCheckFeedback('Correct.');
            } else {
                this.showSurvivalCheckFeedback('No, each person needs 5 pieces of food a day to survive.');
            }
        });
    }
    showSurvivalCheckFeedback(message) {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 320, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(250, 290, message, {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 780 }
        }));
        this.createNextButton(640, 520, 'Start Game', () => {
            this.startFoodCollectionTask();
        });
    }
    startFoodCollectionTask() {
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.foodCounts = {
            'Person A': 0,
            'Person B': 0,
            'Person C': 0
        };
        // Sky
        this.addGameObject(this.add.rectangle(640, 120, 1280, 240, 12578815));
        // Distant hills
        this.addGameObject(this.add.ellipse(250, 285, 650, 220, 7322991));
        this.addGameObject(this.add.ellipse(760, 285, 750, 240, 6204771));
        this.addGameObject(this.add.ellipse(1120, 285, 520, 200, 7915640));
        // Grass field
        this.addGameObject(this.add.rectangle(640, 470, 1280, 500, 5025616));
        // Grass details
        for (let i = 0; i < 90; i += 1) {
            const grass = this.add.line(Phaser.Math.Between(0, 1280), Phaser.Math.Between(395, 690), 0, 0, Phaser.Math.Between(-6, 6), Phaser.Math.Between(-18, -8), 3112242);
            grass.setLineWidth(2);
            this.addGameObject(grass);
        }
        this.addGameObject(this.add.text(40, 60, 'Click each person, then click the tree to collect food for that person. Repeat until all three people have collected food. Select Next to continue.', {
            fontSize: '26px',
            color: '#000000',
            wordWrap: { width: 900 },
            lineSpacing: 6,
            backgroundColor: '#ffffff',
            padding: {
                x: 12,
                y: 8
            }
        }));
        this.drawTree();
        this.avatars = [];
        this.selectedAvatar = null;
        this.foodCollectionNextShown = false;
        const baselineY = 360;
        const personA = this.createHumanAvatar(170, baselineY, 'Person A', 1.08, 13382451, 0);
        const personB = this.createHumanAvatar(450, baselineY, 'Person B', 1, 3368652, 0);
        const personC = this.createHumanAvatar(730, baselineY, 'Person C', 1, 3381606, 0);
        this.avatars.push(personA, personB, personC);
    }
    drawTree() {
        this.addGameObject(this.add.rectangle(1085, 390, 50, 145, 9132587));
        this.addGameObject(this.add.circle(1085, 245, 95, 2062894));
        this.addGameObject(this.add.circle(1015, 300, 76, 3119930));
        this.addGameObject(this.add.circle(1155, 300, 76, 3119930));
        this.addGameObject(this.add.circle(1085, 350, 82, 2329141));
        this.addGameObject(this.add.circle(1045, 235, 60, 3976520));
        this.addGameObject(this.add.circle(1128, 235, 60, 3976520));
        const fruitPositions = [
            [
                -45,
                -75
            ],
            [
                -15,
                -90
            ],
            [
                20,
                -82
            ],
            [
                52,
                -63
            ],
            [
                -75,
                -30
            ],
            [
                -35,
                -35
            ],
            [
                0,
                -45
            ],
            [
                38,
                -35
            ],
            [
                78,
                -20
            ],
            [
                -88,
                22
            ],
            [
                -48,
                18
            ],
            [
                -10,
                5
            ],
            [
                28,
                12
            ],
            [
                68,
                28
            ],
            [
                -56,
                62
            ],
            [
                -18,
                55
            ],
            [
                22,
                62
            ],
            [
                58,
                70
            ]
        ];
        fruitPositions.forEach(position => {
            const fruit = this.add.circle(1085 + position[0], 285 + position[1], 7, 11674146);
            fruit.setStrokeStyle(1, 0);
            this.addGameObject(fruit);
        });
        const treeClickZone = this.add.zone(1085, 305, 340, 380);
        treeClickZone.setInteractive({ useHandCursor: true });
        treeClickZone.on('pointerdown', () => {
            this.collectFoodFromTree();
        });
        this.addGameObject(treeClickZone);
    }
    createBasket(x, y, scale) {
        const basket = this.add.container(x, y);
        const basketColor = 12089650;
        const basketDark = 6042903;
        const basketLight = 14195274;
        const handle = this.add.arc(0, -11 * scale, 18 * scale, 205, 335, true);
        handle.setStrokeStyle(4 * scale, basketDark);
        const body = this.add.rectangle(0, 8 * scale, 34 * scale, 26 * scale, basketColor);
        body.setStrokeStyle(2 * scale, basketDark);
        const rim = this.add.rectangle(0, -4 * scale, 40 * scale, 8 * scale, basketLight);
        rim.setStrokeStyle(2 * scale, basketDark);
        basket.add([
            handle,
            body,
            rim
        ]);
        return basket;
    }
    createHumanAvatar(x, y, label, scale, shirtColor, startingFood = 0) {
        const avatar = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        avatar.add([
            this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor),
            this.add.circle(0, -43 * scale, 24 * scale, skinColor),
            this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor),
            this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor),
            this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor),
            this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0),
            this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0),
            this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678),
            this.add.rectangle(0, -27 * scale, 12 * scale, 2 * scale, 0),
            this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor),
            this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor),
            this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor),
            this.createBasket(39 * scale, 31 * scale, scale),
            this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor),
            this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor),
            this.add.text(0, 135 * scale, label, {
                fontSize: '22px',
                color: '#000000'
            }).setOrigin(0.5)
        ]);
        const selectPerson = () => {
            this.selectAvatar(avatar);
        };
        const clickZones = [
            this.add.zone(0, -47 * scale, 70 * scale, 65 * scale),
            this.add.zone(0, 8 * scale, 65 * scale, 78 * scale),
            this.add.zone(-32 * scale, 10 * scale, 32 * scale, 70 * scale),
            this.add.zone(32 * scale, 10 * scale, 32 * scale, 70 * scale),
            this.add.zone(39 * scale, 31 * scale, 60 * scale, 65 * scale),
            this.add.zone(-12 * scale, 75 * scale, 32 * scale, 65 * scale),
            this.add.zone(12 * scale, 75 * scale, 32 * scale, 65 * scale)
        ];
        clickZones.forEach(zone => {
            zone.setInteractive({ useHandCursor: true });
            zone.on('pointerdown', selectPerson);
            avatar.add(zone);
        });
        avatar.personLabel = label;
        avatar.foodCount = 0;
        for (let i = 0; i < startingFood; i += 1) {
            avatar.foodCount += 1;
            const position = avatar.foodCount - 1;
            const appleX = 39 + (position % 3 - 1) * 15;
            const appleY = 25 + Math.floor(position / 3) * 13;
            avatar.add(this.add.circle(appleX, appleY, 5.5, 11674146));
        }
        this.addGameObject(avatar);
        return avatar;
    }
    showFoodCollectionNextButtonIfReady() {
        const allThreeCollected = this.foodCounts['Person A'] > 0 && this.foodCounts['Person B'] > 0 && this.foodCounts['Person C'] > 0;
        if (allThreeCollected && !this.foodCollectionNextShown) {
            this.foodCollectionNextShown = true;
            this.createGameNextButton(640, 675, 'Next', () => {
                this.showDistributionDisplay();
            });
        }
    }
    collectFoodFromTree() {
        if (!this.selectedAvatar) {
            return;
        }
        const fixedFood = this.getFixedFoodCounts();
        const person = this.selectedAvatar.personLabel;
        if (person === 'Person A') {
            this.gameData.treeClicks.personA += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personA;
            this.gameData.treeFruitCollected.personA = fixedFood.personA;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personA);
            this.showFoodCollectionNextButtonIfReady();
            return;
        }
        if (person === 'Person B') {
            this.gameData.treeClicks.personB += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personB;
            this.gameData.treeFruitCollected.personB = fixedFood.personB;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personB);
            this.showFoodCollectionNextButtonIfReady();
            return;
        }
        if (person === 'Person C') {
            this.gameData.treeClicks.personC += 1;
            if (this.foodCounts[person] > 0) {
                return;
            }
            this.foodCounts[person] = fixedFood.personC;
            this.gameData.treeFruitCollected.personC = fixedFood.personC;
            this.addFoodToBasket(this.selectedAvatar, fixedFood.personC);
            this.showFoodCollectionNextButtonIfReady();
        }
    }
    addFoodToBasket(avatar, amount) {
        for (let i = 0; i < amount; i += 1) {
            avatar.foodCount += 1;
            const position = avatar.foodCount - 1;
            const appleX = 39 + (position % 3 - 1) * 15;
            const appleY = 25 + Math.floor(position / 3) * 13;
            avatar.add(this.add.circle(appleX, appleY, 5.5, 11674146));
        }
    }
    selectAvatar(avatar) {
        this.selectedAvatar = avatar;
        this.avatars.forEach(person => {
            if (person.selectionBox) {
                person.selectionBox.destroy();
                person.selectionBox = null;
            }
            person.setDepth(10);
        });
        avatar.setDepth(100);
        avatar.selectionBox = this.add.rectangle(avatar.x, avatar.y, 180, 260, 0, 0);
        avatar.selectionBox.setStrokeStyle(4, 0);
        avatar.selectionBox.setDepth(99);
        this.addGameObject(avatar.selectionBox);
    }
    update() {
    }
    showDistributionDisplay() {
        this.clearGameObjects();
        this.clearQuestionScreen();
        this.cameras.main.setBackgroundColor('#7fcf7a');
        const fixedFood = this.getFixedFoodCounts();
        this.blanketFoodCount = 0;
        this.totalFoodToCount = fixedFood.total;
        this.distributionNextShown = false;
        this.countingSelectedPerson = null;
        this.countingFoodsByPerson = {
            'Person A': [],
            'Person B': [],
            'Person C': []
        };
        this.countingPersonCompleted = {
            'Person A': false,
            'Person B': false,
            'Person C': false
        };
        this.countingPersonSelectors = {};
        const baselineY = 170;
        const people = [
            {
                label: 'Person A',
                x: 230,
                scale: 1.12,
                color: 13382451,
                foodAmount: fixedFood.personA
            },
            {
                label: 'Person B',
                x: 620,
                scale: 1,
                color: 3368652,
                foodAmount: fixedFood.personB
            },
            {
                label: 'Person C',
                x: 1000,
                scale: 0.88,
                color: 3381606,
                foodAmount: fixedFood.personC
            }
        ];
        people.forEach(person => {
            this.addQuestionObject(this.createStaticHumanAvatar(person.x, baselineY, person.label, person.scale, person.color, 0));
            const selector = this.add.rectangle(person.x, baselineY, 210, 270, 16777215, 0);
            selector.setInteractive({ useHandCursor: true });
            selector.setDepth(5);
            selector.on('pointerdown', () => {
                this.selectPersonForFoodDump(person.label);
            });
            this.countingPersonSelectors[person.label] = selector;
            this.addQuestionObject(selector);
            this.createCountingFoodPieces(person.x, baselineY, person.scale, person.foodAmount, person.label);
        });
        this.blanket = this.add.rectangle(640, 425, 420, 115, 14216447);
        this.blanket.setStrokeStyle(4, 3364215);
        this.blanket.setDepth(1);
        this.blanket.setInteractive({ useHandCursor: true });
        this.blanket.on('pointerdown', () => {
            this.dumpSelectedPersonFoodToBlanket();
        });
        this.addQuestionObject(this.blanket);
        const blanketLabel = this.add.text(640, 425, 'Blanket', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        blanketLabel.setDepth(2);
        this.addQuestionObject(blanketLabel);
        this.blanketCounterText = this.add.text(640, 515, 'Pieces counted: 0', {
            fontSize: '26px',
            color: '#000000'
        }).setOrigin(0.5);
        this.blanketCounterText.setDepth(2);
        this.addQuestionObject(this.blanketCounterText);
        this.countingInstructionText = this.add.text(640, 575, 'Click a person, then click the blanket to count all of that person\'s food.', {
            fontSize: '22px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.countingInstructionText);
    }
    createCountingFoodPieces(avatarX, avatarY, scale, foodAmount, personLabel) {
        for (let i = 0; i < foodAmount; i += 1) {
            const foodX = avatarX + (39 + (i % 3 - 1) * 15) * scale;
            const foodY = avatarY + (25 + Math.floor(i / 3) * 13) * scale;
            const food = this.add.circle(foodX, foodY, 7, 11674146);
            food.setStrokeStyle(1, 0);
            food.setDepth(10);
            food.counted = false;
            food.sourcePerson = personLabel;
            this.countingFoodsByPerson[personLabel].push(food);
            this.addQuestionObject(food);
        }
    }
    getCountingBlanketFoodPosition(index) {
        const positions = [
            [
                -150,
                -25
            ],
            [
                -115,
                -25
            ],
            [
                -80,
                -25
            ],
            [
                -150,
                10
            ],
            [
                -115,
                10
            ],
            [
                -80,
                10
            ],
            [
                80,
                -25
            ],
            [
                115,
                -25
            ],
            [
                150,
                -25
            ],
            [
                80,
                10
            ],
            [
                115,
                10
            ],
            [
                150,
                10
            ],
            [
                -150,
                45
            ],
            [
                -115,
                45
            ],
            [
                -80,
                45
            ],
            [
                80,
                45
            ],
            [
                115,
                45
            ],
            [
                150,
                45
            ]
        ];
        return positions[index];
    }
    selectPersonForFoodDump(personLabel) {
        if (this.countingPersonCompleted[personLabel]) {
            this.countingSelectedPerson = null;
            this.countingInstructionText.setText(`${ personLabel }'s food has already been counted.`);
            return;
        }
        this.countingSelectedPerson = personLabel;
        Object.entries(this.countingPersonSelectors).forEach(([label, selector]) => {
            if (this.countingPersonCompleted[label]) {
                selector.setStrokeStyle(3, 7829367, 1);
            } else if (label === personLabel) {
                selector.setStrokeStyle(5, 1797946, 1);
            } else {
                selector.setStrokeStyle(0, 1797946, 0);
            }
        });
        this.countingInstructionText.setText(`${ personLabel } selected. Now click the blanket.`);
    }
    dumpSelectedPersonFoodToBlanket() {
        if (!this.countingSelectedPerson) {
            this.countingInstructionText.setText('Select a person first, then click the blanket.');
            return;
        }
        const selectedPerson = this.countingSelectedPerson;
        const remainingFood = this.countingFoodsByPerson[selectedPerson].filter(food => !food.counted);
        if (remainingFood.length === 0) {
            this.countingSelectedPerson = null;
            this.countingInstructionText.setText(`${ selectedPerson }'s food has already been counted.`);
            return;
        }
        this.gameData.totalFoodCountPersonDumps += 1;
        remainingFood.forEach(food => {
            const blanketPosition = this.getCountingBlanketFoodPosition(this.blanketFoodCount);
            food.counted = true;
            food.x = this.blanket.x + blanketPosition[0];
            food.y = this.blanket.y + blanketPosition[1];
            food.setDepth(20);
            this.blanketFoodCount += 1;
        });
        this.countingPersonCompleted[selectedPerson] = true;
        this.blanketCounterText.setText(`Pieces counted: ${ this.blanketFoodCount }`);
        this.countingInstructionText.setText(`${ selectedPerson }'s food is on the blanket.`);
        this.countingSelectedPerson = null;
        Object.entries(this.countingPersonSelectors).forEach(([label, selector]) => {
            if (this.countingPersonCompleted[label]) {
                selector.setStrokeStyle(3, 7829367, 1);
            } else {
                selector.setStrokeStyle(0, 1797946, 0);
            }
        });
        this.showTotalFoodCountNextButtonIfReady();
    }
    showTotalFoodCountNextButtonIfReady() {
        if (this.blanketFoodCount === this.totalFoodToCount && !this.distributionNextShown) {
            this.distributionNextShown = true;
            this.time.delayedCall(100, () => {
                this.createNextButton(640, 675, 'Next', () => {
                    this.showTotalFoodEstimateQuestion();
                });
            });
        }
    }
    createDraggableFoodPieces(avatarX, avatarY, scale, foodAmount) {
        const getBlanketFoodPosition = index => {
            const positions = [
                [
                    -150,
                    -25
                ],
                [
                    -115,
                    -25
                ],
                [
                    -80,
                    -25
                ],
                [
                    -150,
                    10
                ],
                [
                    -115,
                    10
                ],
                [
                    -80,
                    10
                ],
                [
                    80,
                    -25
                ],
                [
                    115,
                    -25
                ],
                [
                    150,
                    -25
                ],
                [
                    80,
                    10
                ],
                [
                    115,
                    10
                ],
                [
                    150,
                    10
                ],
                [
                    -150,
                    45
                ],
                [
                    -115,
                    45
                ],
                [
                    -80,
                    45
                ],
                [
                    80,
                    45
                ],
                [
                    115,
                    45
                ],
                [
                    150,
                    45
                ]
            ];
            return positions[index];
        };
        for (let i = 0; i < foodAmount; i += 1) {
            const position = i;
            const startX = avatarX + (39 + (position % 3 - 1) * 15) * scale;
            const startY = avatarY + (25 + Math.floor(position / 3) * 13) * scale;
            const food = this.add.circle(startX, startY, 7, 11674146);
            food.setStrokeStyle(1, 0);
            food.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains, { useHandCursor: true });
            food.setDepth(10);
            food.startX = startX;
            food.startY = startY;
            food.counted = false;
            this.input.setDraggable(food);
            food.on('dragstart', () => {
                food.setDepth(20);
            });
            food.on('drag', (pointer, dragX, dragY) => {
                food.x = dragX;
                food.y = dragY;
            });
            food.on('dragend', () => {
                const blanketBounds = this.blanket.getBounds();
                if (Phaser.Geom.Rectangle.Contains(blanketBounds, food.x, food.y)) {
                    if (!food.counted) {
                        food.counted = true;
                        this.blanketFoodCount += 1;
                        const pilePosition = this.blanketFoodCount - 1;
                        const blanketPosition = getBlanketFoodPosition(pilePosition);
                        food.x = this.blanket.x + blanketPosition[0];
                        food.y = this.blanket.y + blanketPosition[1];
                        this.blanketCounterText.setText(`Pieces counted: ${ this.blanketFoodCount }`);
                        if (this.blanketFoodCount === this.totalFoodToCount && !this.distributionNextShown) {
                            this.distributionNextShown = true;
                            this.time.delayedCall(100, () => {
                                this.createNextButton(640, 675, 'Next', () => {
                                    this.showTotalFoodEstimateQuestion();
                                });
                            });
                        }
                    }
                    food.setDepth(20);
                } else {
                    if (!food.counted) {
                        food.x = food.startX;
                        food.y = food.startY;
                    }
                    food.setDepth(10);
                }
            });
            this.addQuestionObject(food);
        }
    }
    showTotalFoodEstimateQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 520, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 220, 'How many total pieces of food do you estimate the group collected today?', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 900 },
            lineSpacing: 8
        }).setOrigin(0.5));
        let answers = [
            'More than 15 pieces of food',
            'Exactly 15 pieces of food',
            'Less than 15 pieces of food'
        ];
        if (Phaser.Math.Between(0, 1) === 1) {
            answers = answers.reverse();
        }
        this.createAnswerButton(640, 360, answers[0], 'totalFoodEstimate');
        this.createAnswerButton(640, 460, answers[1], 'totalFoodEstimate');
        this.createAnswerButton(640, 560, answers[2], 'totalFoodEstimate');
    }
    showRedistributionBlock(index = 0) {
        if (!this.gameData.redistributionTaskOrder) {
            this.gameData.redistributionTaskOrder = Phaser.Math.Between(0, 1) === 0
                ? ['equal', 'partial'] : ['partial', 'equal'];
            this.gameData.redistributionBlocksCompleted = [];
        }
        const block = this.gameData.redistributionTaskOrder[index];
        if (!block) {
            this.showRedistributionFeasibility();
            return;
        }
        const ordinal = index === 0 ? 'Second' : 'Third';
        const detail = block === 'equal'
            ? `${ordinal}, see what happens when you divide the food equally among the members of the group.`
            : `${ordinal}, see what happens when you move food from people with more than 5 pieces of food to members of the group with less.`;
        this.showFoodPolicyTransition(`Task ${index + 2}`, detail, () => {
            if (block === 'equal') this.showEqualDivisionTask();
            else this.showPartialRedistributionTask();
        });
    }
    completeRedistributionBlock(block) {
        const order = this.gameData.redistributionTaskOrder;
        if (!order || !order.includes(block)) throw new Error('Redistribution block order missing');
        if (!this.gameData.redistributionBlocksCompleted.includes(block)) {
            this.gameData.redistributionBlocksCompleted.push(block);
        }
        this.showRedistributionBlock(order.indexOf(block) + 1);
    }

    showEqualDivisionTask(restoreOriginal = false) {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        const totalFood = fixedFood.total;
        const roleLabels = [
            'Person A',
            'Person B',
            'Person C'
        ];
        const equalShare = totalFood / roleLabels.length;
        this.equalDivisionCounts = {
            'Person A': 0,
            'Person B': 0,
            'Person C': 0
        };
        this.equalDivisionAssignedCount = 0;
        this.equalDivisionCompleted = false;
        this.equalDivisionNextShown = false;
        this.equalDivisionFoods = [];
        this.equalDivisionInstructionText = this.add.text(640, 45, 'Click the blanket to divide the food equally among all three people.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.equalDivisionInstructionText);
        this.equalDivisionBlanket = this.add.rectangle(640, 195, 500, 130, 14216447);
        this.equalDivisionBlanket.setStrokeStyle(4, 3364215);
        this.equalDivisionBlanket.setDepth(1);
        this.equalDivisionBlanket.setInteractive({ useHandCursor: true });
        this.addQuestionObject(this.equalDivisionBlanket);
        this.equalDivisionBlanketLabel = this.add.text(640, 195, 'Click the blanket', {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
        this.equalDivisionBlanketLabel.setDepth(2);
        this.addQuestionObject(this.equalDivisionBlanketLabel);
        const baselineY = 430;
        this.equalDivisionBaselineY = baselineY;
        this.addQuestionObject(this.createStaticHumanAvatar(260, baselineY, 'Person A', 1.05, 13382451, 0));
        this.addQuestionObject(this.createStaticHumanAvatar(640, baselineY, 'Person B', 1, 3368652, 0));
        this.addQuestionObject(this.createStaticHumanAvatar(1020, baselineY, 'Person C', 0.9, 3381606, 0));
        this.createEqualDivisionFoodPieces(totalFood);
        if (restoreOriginal) {
            const counts = [fixedFood.personA, fixedFood.personB, fixedFood.personC];
            const scales = [1.05, 1, 0.9];
            const centers = [260, 640, 1020];
            let foodIndex = 0;
            roleLabels.forEach((role, index) => {
                const scale = scales[index];
                for (let pile = 0; pile < counts[index]; pile++) {
                    const food = this.equalDivisionFoods[foodIndex++];
                    food.assignedPerson = role;
                    food.x = centers[index] + 39 * scale + (pile % 3 - 1) * 15 * scale;
                    food.y = baselineY + 31 * scale - 6 * scale + Math.floor(pile / 3) * 13 * scale;
                    food.setDepth(20);
                }
                this.equalDivisionCounts[role] = counts[index];
            });
            this.equalDivisionAssignedCount = totalFood;
        }
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.showEqualDivisionTask(true);
        }, 14540253, '#000000');
        this.equalDivisionBlanket.on('pointerdown', () => {
            if (this.equalDivisionCompleted) {
                return;
            }
            const basketPositions = {
                'Person A': {
                    x: 260 + 39 * 1.05,
                    y: this.equalDivisionBaselineY + 31 * 1.05,
                    scale: 1.05
                },
                'Person B': {
                    x: 640 + 39,
                    y: this.equalDivisionBaselineY + 31,
                    scale: 1
                },
                'Person C': {
                    x: 1020 + 39 * 0.9,
                    y: this.equalDivisionBaselineY + 31 * 0.9,
                    scale: 0.9
                }
            };
            this.equalDivisionFoods.forEach((food, index) => {
                const roleIndex = Math.floor(index / equalShare);
                const roleLabel = roleLabels[roleIndex];
                const pilePosition = index % equalShare;
                const basket = basketPositions[roleLabel];
                food.assignedPerson = roleLabel;
                food.x = basket.x + (pilePosition % 3 - 1) * 15 * basket.scale;
                food.y = basket.y - 6 * basket.scale + Math.floor(pilePosition / 3) * 13 * basket.scale;
                food.setDepth(20);
            });
            this.equalDivisionCounts = {
                'Person A': equalShare,
                'Person B': equalShare,
                'Person C': equalShare
            };
            this.equalDivisionAssignedCount = totalFood;
            this.equalDivisionCompleted = true;
            this.gameData.equalDivisionShortcutUsed = true;
            this.equalDivisionBlanket.disableInteractive();
            this.equalDivisionBlanket.setFillStyle(13097451);
            this.equalDivisionBlanketLabel.setText('Food divided equally');
            this.equalDivisionInstructionText.setText(`The food has been divided equally. \n \n Each person now has ${ equalShare } pieces.`);
            if (!this.equalDivisionNextShown) {
                this.equalDivisionNextShown = true;
                this.createNextButton(640, 675, 'Next', () => {
                    this.gameData.equalDivisionFinal.personA = this.equalDivisionCounts['Person A'];
                    this.gameData.equalDivisionFinal.personB = this.equalDivisionCounts['Person B'];
                    this.gameData.equalDivisionFinal.personC = this.equalDivisionCounts['Person C'];
                    this.showPerCapitaQuestion();
                });
            }
        });

        ;
    }
    createEqualDivisionFoodPieces(totalFood) {
        const positions = [
            [
                -170,
                -25
            ],
            [
                -130,
                -25
            ],
            [
                -90,
                -25
            ],
            [
                -170,
                10
            ],
            [
                -130,
                10
            ],
            [
                -90,
                10
            ],
            [
                90,
                -25
            ],
            [
                130,
                -25
            ],
            [
                170,
                -25
            ],
            [
                90,
                10
            ],
            [
                130,
                10
            ],
            [
                170,
                10
            ],
            [
                -170,
                45
            ],
            [
                -130,
                45
            ],
            [
                -90,
                45
            ],
            [
                90,
                45
            ],
            [
                130,
                45
            ],
            [
                170,
                45
            ]
        ];
        this.equalDivisionFoods = [];
        for (let i = 0; i < totalFood; i += 1) {
            const position = positions[i];
            const food = this.add.circle(this.equalDivisionBlanket.x + position[0], this.equalDivisionBlanket.y + position[1], 7, 11674146);
            food.setStrokeStyle(1, 0);
            food.setDepth(10);
            food.assignedPerson = null;
            this.equalDivisionFoods.push(food);
            this.addQuestionObject(food);
        }
    }
    showPerCapitaQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 900, 450, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(230, 170, 'After dividing the food equally, how many people had at least 5 pieces?', {
            fontSize: '28px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 820 }
        }));
        const answers = [
            '0 people',
            '2 people',
            '3 people'
        ];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers.forEach((label, index) => this.createAnswerButton(640, 365 + index * 80, label, 'equalDivisionOutcomeChoice'));

        ;
    }
    showGroupDistributionPreferenceQuestion() {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(260, 115, 'Person A', 0.78, 13382451, fixedFood.personA));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 115, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(980, 115, 'Person C', 0.66, 3381606, fixedFood.personC));
        this.addQuestionObject(this.add.rectangle(640, 440, 1180, 390, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 320, 'In this scenario, should the group divide the food equally among all members, or should each member of the group keep the food they collected?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The group should divide the food equally among all members.',
            'Each member of the group should keep the food they collected.'
        ]);
        this.createAnswerButton(640, 470, answers[0], 'groupDistributionPreference');
        this.createAnswerButton(640, 575, answers[1], 'groupDistributionPreference');

        ;
    }
    createStaticHumanAvatar(x, y, label, scale, shirtColor, foodAmount = 0, showBasket = true) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.foodCount = 0;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.rectangle(0, -27 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        if (showBasket) {
            person.add(this.createBasket(39 * scale, 31 * scale, scale));
            for (let i = 0; i < foodAmount; i += 1) {
                person.foodCount += 1;
                const position = person.foodCount - 1;
                const appleX = (39 + (position % 3 - 1) * 15) * scale;
                const appleY = (25 + Math.floor(position / 3) * 13) * scale;
                person.add(this.add.circle(appleX, appleY, 5.5 * scale, 11674146));
            }
        }
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, 135 * scale, label, {
            fontSize: '26px',
            color: '#000000'
        }).setOrigin(0.5));
        return person;
    }
    showPartialRedistributionTask() {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        const roleLabels = [
            'Person A',
            'Person B',
            'Person C'
        ];
        const people = [
            {
                label: 'Person A',
                x: 260,
                scale: 1.05,
                color: 13382451,
                foodAmount: fixedFood.personA
            },
            {
                label: 'Person B',
                x: 640,
                scale: 1,
                color: 3368652,
                foodAmount: fixedFood.personB
            },
            {
                label: 'Person C',
                x: 1020,
                scale: 0.9,
                color: 3381606,
                foodAmount: fixedFood.personC
            }
        ];
        this.partialRedistributionCounts = {
            'Person A': fixedFood.personA,
            'Person B': fixedFood.personB,
            'Person C': fixedFood.personC
        };
        this.partialRedistributionFoods = [];
        this.partialRedistributionFoodsByPerson = {
            'Person A': [],
            'Person B': [],
            'Person C': []
        };
        this.partialRedistributionCompleted = false;
        this.partialRedistributionNextShown = false;
        this.partialRedistributionInstructionText = this.add.text(640, 65, 'Click the button below to see what happens when people with more than 5 pieces share some of their food.', {
            fontSize: '26px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1050 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.partialRedistributionInstructionText);
        const baselineY = 390;
        this.partialRedistributionBaselineY = baselineY;
        const basketPositions = {
            'Person A': {
                x: 260 + 39 * 1.05,
                y: baselineY + 31 * 1.05,
                scale: 1.05
            },
            'Person B': {
                x: 640 + 39,
                y: baselineY + 31,
                scale: 1
            },
            'Person C': {
                x: 1020 + 39 * 0.9,
                y: baselineY + 31 * 0.9,
                scale: 0.9
            }
        };
        const placeFood = (food, personLabel, pilePosition) => {
            const basket = basketPositions[personLabel];
            food.x = basket.x + (pilePosition % 3 - 1) * 15 * basket.scale;
            food.y = basket.y - 6 * basket.scale + Math.floor(pilePosition / 3) * 13 * basket.scale;
            food.setDepth(20);
        };
        people.forEach(person => {
            this.addQuestionObject(this.createStaticHumanAvatar(person.x, baselineY, person.label, person.scale, person.color, 0));
            for (let i = 0; i < person.foodAmount; i += 1) {
                const food = this.add.circle(0, 0, 7, 11674146);
                food.setStrokeStyle(1, 0);
                food.assignedPerson = person.label;
                placeFood(food, person.label, i);
                this.partialRedistributionFoods.push(food);
                this.partialRedistributionFoodsByPerson[person.label].push(food);
                this.addQuestionObject(food);
            }
        });
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.showPartialRedistributionTask();
        }, 14540253, '#000000');
        const redistributionButton = this.add.rectangle(640, 675, 560, 64, 0);
        redistributionButton.setStrokeStyle(3, 0);
        redistributionButton.setInteractive({ useHandCursor: true });
        redistributionButton.setDepth(1000);
        const redistributionButtonText = this.add.text(640, 675, 'Redistribute to meet survival needs', {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        redistributionButtonText.setDepth(1001);
        this.addQuestionObject(redistributionButton);
        this.addQuestionObject(redistributionButtonText);
        redistributionButton.on('pointerdown', () => {
            if (this.partialRedistributionCompleted) {
                return;
            }
            const targetAllocation = this.buildSurplusOnlyPartialAllocation();
            const transferableFood = [];
            roleLabels.forEach((personLabel, index) => {
                const personFood = this.partialRedistributionFoodsByPerson[personLabel];
                while (personFood.length > targetAllocation[index]) {
                    transferableFood.push(personFood.pop());
                }
            });
            roleLabels.forEach((personLabel, index) => {
                const personFood = this.partialRedistributionFoodsByPerson[personLabel];
                while (personFood.length < targetAllocation[index]) {
                    const transferredFood = transferableFood.shift();
                    transferredFood.assignedPerson = personLabel;
                    personFood.push(transferredFood);
                }
            });
            roleLabels.forEach(personLabel => {
                this.partialRedistributionFoodsByPerson[personLabel].forEach((food, pilePosition) => {
                    food.assignedPerson = personLabel;
                    placeFood(food, personLabel, pilePosition);
                });
            });
            this.partialRedistributionCounts = {
                'Person A': targetAllocation[0],
                'Person B': targetAllocation[1],
                'Person C': targetAllocation[2]
            };
            this.partialRedistributionCompleted = true;
            this.gameData.partialRedistributionShortcutUsed = true;
            redistributionButton.disableInteractive();
            redistributionButton.setVisible(false);
            redistributionButtonText.setVisible(false);
            this.partialRedistributionInstructionText.setText('Food above the survival threshold has been redistributed. \n \n The greatest possible number of people now have at least 5 pieces.');
            if (!this.partialRedistributionNextShown) {
                this.partialRedistributionNextShown = true;
                this.createNextButton(640, 675, 'Next', () => {
                    this.gameData.partialRedistributionFinal.personA = this.partialRedistributionCounts['Person A'];
                    this.gameData.partialRedistributionFinal.personB = this.partialRedistributionCounts['Person B'];
                    this.gameData.partialRedistributionFinal.personC = this.partialRedistributionCounts['Person C'];
                    this.gameData.partialRedistributionSurvivors = Object.values(this.partialRedistributionCounts).filter(count => count >= 5).length;
                    this.showPartialRedistributionPreferenceQuestion();
                });
            }
        });

        ;
    }
    showPartialRedistributionPreferenceQuestion() {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(260, 125, 'Person A', 0.78, 13382451, fixedFood.personA));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 125, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(980, 125, 'Person C', 0.66, 3381606, fixedFood.personC));
        this.addQuestionObject(this.add.rectangle(640, 460, 1080, 340, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 295, 'In this scenario, should the group redistribute the food to allow the greatest possible number of people to receive at least 5 pieces, or should each person keep the food they collected?', {
            fontSize: '25px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 8
        }).setOrigin(0.5, 0));
        const answers = Phaser.Utils.Array.Shuffle([
            'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
            'Each person should keep the food they collected.'
        ]);
        this.createAnswerButton(640, 480, answers[0], 'partialRedistributionPreference');
        this.createAnswerButton(640, 570, answers[1], 'partialRedistributionPreference');

        ;
    }
    showPersonalRedistributionQuestion() {
        this.clearQuestionScreen();
        this.gameData.personalRedistributionSelected = {
            noRedistribution: false,
            equalRedistribution: false,
            partialRedistribution: false
        };
        this.personalRedistributionNextShown = false;
        this.personalRedistributionChecks = {};
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 520, 16777215).setStrokeStyle(4, 0));
        this.addQuestionObject(this.add.text(640, 150, 'Which approaches do you most support? Select all that apply.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const options = Phaser.Utils.Array.Shuffle([
            {
                label: 'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label: 'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label: 'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
                key: 'partialRedistribution'
            }
        ]);
        options.forEach((option, index) => {
            this.createPersonalRedistributionCheckboxButton(640, 290 + index * 105, option.label, option.key);
        });

        ;
    }
    createPersonalRedistributionCheckboxButton(centerX, centerY, label, key) {
        const box = this.add.rectangle(centerX - 420, centerY, 34, 34, 16777215);
        box.setStrokeStyle(3, 0);
        box.setInteractive({ useHandCursor: true });
        const check = this.add.text(centerX - 420, centerY, '\u2713', {
            fontSize: '25px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        check.setVisible(false);
        this.personalRedistributionChecks[key] = check;
        const text = this.add.text(centerX - 375, centerY, label, {
            fontSize: '23px',
            color: '#000000',
            wordWrap: { width: 780 }
        }).setOrigin(0, 0.5);
        text.setInteractive({ useHandCursor: true });
        const toggle = () => {
            this.gameData.personalRedistributionSelected[key] = !this.gameData.personalRedistributionSelected[key];
            Object.entries(this.personalRedistributionChecks).forEach(([k, mark]) => mark.setVisible(this.gameData.personalRedistributionSelected[k]));
            const anySelected = this.gameData.personalRedistributionSelected.noRedistribution || this.gameData.personalRedistributionSelected.equalRedistribution || this.gameData.personalRedistributionSelected.partialRedistribution;
            if (anySelected) {
                if (!this.personalRedistributionNextShown) {
                    this.personalRedistributionNextShown = true;
                    this.createNextButton(640, 675, 'Next', () => {
                        this.showEconomicPrinciple();
                    });
                }
            } else {
                if (this.currentNextButton) {
                    this.currentNextButton.destroy();
                    this.currentNextButton = null;
                }
                if (this.currentNextText) {
                    this.currentNextText.destroy();
                    this.currentNextText = null;
                }
                this.personalRedistributionNextShown = false;
            }
        };
        box.on('pointerdown', toggle);
        text.on('pointerdown', toggle);
        this.addQuestionObject(box);
        this.addQuestionObject(check);
        this.addQuestionObject(text);
    }
    showSurvivalRedistributionQuestion() {
        this.clearQuestionScreen();
        this.gameData.survivalRedistributionSelected = {
            noRedistribution: false,
            equalRedistribution: false,
            partialRedistribution: false
        };
        /*
     * Preserve compatibility with existing
     * Google Sheets columns and scripts.
     */
        this.gameData.redistributionRulesSelected = this.gameData.survivalRedistributionSelected;
        this.survivalRedistributionNextShown = false;
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 520, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 160, 'Which approaches would allow the most people to survive? Select all that apply.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const options = Phaser.Utils.Array.Shuffle([
            {
                label: 'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label: 'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label: 'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
                key: 'partialRedistribution'
            }
        ]);
        options.forEach((option, index) => {
            this.createCheckboxButton(640, 300 + index * 100, option.label, option.key);
        });

        ;
    }
    createCheckboxButton(centerX, centerY, label, key) {
        const box = this.add.rectangle(centerX - 420, centerY, 34, 34, 16777215);
        box.setStrokeStyle(3, 0);
        box.setInteractive({ useHandCursor: true });
        const check = this.add.text(centerX - 420, centerY, '\u2713', {
            fontSize: '25px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        check.setVisible(false);
        const text = this.add.text(centerX - 375, centerY, label, {
            fontSize: '23px',
            color: '#000000',
            wordWrap: { width: 780 }
        }).setOrigin(0, 0.5);
        text.setInteractive({ useHandCursor: true });
        const toggle = () => {
            this.gameData.survivalRedistributionSelected[key] = !this.gameData.survivalRedistributionSelected[key];
            this.gameData.redistributionRulesSelected = this.gameData.survivalRedistributionSelected;
            check.setVisible(this.gameData.survivalRedistributionSelected[key]);
            const anySelected = this.gameData.survivalRedistributionSelected.noRedistribution || this.gameData.survivalRedistributionSelected.equalRedistribution || this.gameData.survivalRedistributionSelected.partialRedistribution;
            if (anySelected) {
                if (!this.survivalRedistributionNextShown) {
                    this.survivalRedistributionNextShown = true;
                    this.createNextButton(640, 675, 'Next', () => {
                        this.showPersonalRedistributionQuestion();
                    });
                }
            } else {
                if (this.currentNextButton) {
                    this.currentNextButton.destroy();
                    this.currentNextButton = null;
                }
                if (this.currentNextText) {
                    this.currentNextText.destroy();
                    this.currentNextText = null;
                }
                this.survivalRedistributionNextShown = false;
            }
        };
        box.on('pointerdown', toggle);
        text.on('pointerdown', toggle);
        this.addQuestionObject(box);
        this.addQuestionObject(check);
        this.addQuestionObject(text);
    }
    showSocialContractQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 235, 'Should the group agree to make sure everyone has enough food to survive?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The group should agree to make sure everyone has enough food to survive.',
            'The group should not agree to make sure everyone has enough food to survive.'
        ]);
        this.createAnswerButton(640, 410, answers[0], 'socialContractGuarantee');
        this.createAnswerButton(640, 535, answers[1], 'socialContractGuarantee');

        ;
    }
    showEconomicPrinciple(index = 0) {
        if (!this.gameData.economicPrincipleOrder) {
            this.gameData.economicPrincipleOrder = Phaser.Utils.Array.Shuffle([
                'personalVsGroupResponsibility', 'fairRuleChoice', 'foodPriorityChoice',
                'workBreakChoice', 'floodPreparationChoice', 'personDShareChoice',
                'personDEmpathyChoice', 'cooperationCompetitionChoice'
            ]);
        }
        this.economicPrincipleIndex = index;
        const screens = {
            personalVsGroupResponsibility: () => this.showPersonalVsGroupResponsibilityQuestion(),
            fairRuleChoice: () => this.showFairRuleQuestion(),
            foodPriorityChoice: () => this.showFoodRankReminderScreen(),
            workBreakChoice: () => this.showHardWorkReminderScreen(),
            floodPreparationChoice: () => this.showFloodRiskInstructionScreen(),
            personDShareChoice: () => this.showPersonDInstructionScreen(() => this.showPersonDShareQuestion()),
            personDEmpathyChoice: () => this.showPersonDInstructionScreen(() => this.showPersonDEmpathyQuestion()),
            cooperationCompetitionChoice: () => this.showCooperationCompetitionInstructionScreen()
        };
        const key = this.gameData.economicPrincipleOrder[index];
        if (!key) { this.showSelfInterestRandomizationScreen(); return; }
        screens[key]();
    }
    showPersonalVsGroupResponsibilityQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 230, 'In this situation, which should receive greater priority: personal responsibility or shared responsibility for meeting food needs?', {
            fontSize: '25px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The group sharing responsibility for meeting everyone’s food needs.',
            'Each person taking responsibility for meeting their own food needs.'
        ]);
        this.createAnswerButton(640, 430, answers[0], 'personalVsGroupResponsibility');
        this.createAnswerButton(640, 550, answers[1], 'personalVsGroupResponsibility');

        ;
    }
    showFairRuleQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 500, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 230, 'Which approach to distributing food would be fairer?', {
            fontSize: '29px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'Give extra food to people who need help so they have a better chance to hunt and gather successfully.',
            'Give people food according to how much they contribute through hunting and gathering.'
        ]);
        this.createAnswerButton(640, 410, answers[0], 'fairRuleChoice');
        this.createAnswerButton(640, 540, answers[1], 'fairRuleChoice');

        ;
    }
    showFoodRankReminderScreen() {
        this.clearQuestionScreen();
        this.gameData.foodRankReminder = 'shown';
        this.addQuestionObject(this.add.rectangle(640, 360, 1080, 520, 16777215)).setStrokeStyle(4, 0);
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(280, 185, 'Person A', 1.12, 13382451, fixedFood.personA));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 185, 'Person B', 1, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(1000, 185, 'Person C', 0.88, 3381606, fixedFood.personC));
        this.addQuestionObject(this.add.text(640, 450, 'Remember, Person A usually collects the most pieces of food per day. Person B usually collects less than Person A but more than Person C. Person C usually collects the least pieces of food per day.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 940 },
            lineSpacing: 8
        }).setOrigin(0.5));
        this.createNextButton(640, 675, 'Next', () => {
            this.showFoodPriorityQuestion();
        });
    }
    showFoodPriorityQuestion() {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(280, 90, 'Person A', 0.82, 13382451, fixedFood.personA));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 90, 'Person B', 0.74, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(1000, 90, 'Person C', 0.66, 3381606, fixedFood.personC));
        this.addQuestionObject(this.add.rectangle(640, 435, 1120, 390, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 285, 'Whose food needs should the group give greater priority?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'Person C, because they usually collect the least food and need the most help to survive.',
            'Person A, because they usually collect the most food and can contribute the most to feeding the group.'
        ]);
        this.createAnswerButton(640, 400, answers[0], 'foodPriorityChoice');
        this.createAnswerButton(640, 535, answers[1], 'foodPriorityChoice');

        ;
    }
    showHardWorkReminderScreen() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1080, 520, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.createTiredHumanAvatar(280, 240, 'Person A', 1.12, 13382451));
        this.addQuestionObject(this.createTiredHumanAvatar(640, 240, 'Person B', 1, 3368652));
        this.addQuestionObject(this.createTiredHumanAvatar(1000, 240, 'Person C', 0.88, 3381606));
        this.addQuestionObject(this.add.text(640, 480, 'Hunting and gathering food is hard work.', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 940 },
            lineSpacing: 8
        }).setOrigin(0.5));
        this.createNextButton(640, 675, 'Next', () => {
            this.showWorkBreakQuestion();
        });
    }
    showWorkBreakQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.createTiredFace(640, 145, 1.6));
        this.addQuestionObject(this.add.rectangle(640, 465, 1120, 360, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 340, 'One day, one of the people is exhausted and wants to take a break from hunting and gathering food. Should the person keep working or take a break?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The person should take a break.',
            'The person should keep hunting and gathering food.'
        ]);
        this.createAnswerButton(640, 475, answers[0], 'workBreakChoice');
        this.createAnswerButton(640, 570, answers[1], 'workBreakChoice');

        ;
    }
    createTiredHumanAvatar(x, y, label, scale, shirtColor) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        const sweatColor = 4891615;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.rectangle(-8 * scale, -43 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(8 * scale, -43 * scale, 12 * scale, 2 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.arc(0, -24 * scale, 9 * scale, 200, 340, false, 0));
        person.add(this.add.circle(-9 * scale, -50 * scale, 3.2 * scale, sweatColor));
        person.add(this.add.circle(7 * scale, -59 * scale, 3 * scale, sweatColor));
        person.add(this.add.circle(-22 * scale, -38 * scale, 3.5 * scale, sweatColor));
        person.add(this.add.circle(18 * scale, -45 * scale, 2.8 * scale, sweatColor));
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        person.add(this.add.rectangle(-34 * scale, 15 * scale, 10 * scale, 52 * scale, skinColor).setAngle(18));
        person.add(this.add.rectangle(34 * scale, 15 * scale, 10 * scale, 52 * scale, skinColor).setAngle(-18));
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, 135 * scale, label, {
            fontSize: '26px',
            color: '#000000'
        }).setOrigin(0.5));
        return person;
    }
    createTiredFace(x, y, scale) {
        const face = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const sweatColor = 4891615;
        face.add(this.add.circle(0, 0, 48 * scale, skinColor));
        face.add(this.add.ellipse(0, -45 * scale, 90 * scale, 30 * scale, hairColor));
        face.add(this.add.ellipse(-34 * scale, -28 * scale, 22 * scale, 38 * scale, hairColor));
        face.add(this.add.ellipse(34 * scale, -28 * scale, 22 * scale, 38 * scale, hairColor));
        face.add(this.add.rectangle(-18 * scale, -5 * scale, 20 * scale, 3 * scale, 0));
        face.add(this.add.rectangle(18 * scale, -5 * scale, 20 * scale, 3 * scale, 0));
        face.add(this.add.rectangle(0, 10 * scale, 5 * scale, 16 * scale, 10181678));
        face.add(this.add.arc(0, 35 * scale, 18 * scale, 200, 340, false, 0));
        face.add(this.add.circle(-15 * scale, -30 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(-40 * scale, -6 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(-46 * scale, 10 * scale, 4.5 * scale, sweatColor));
        face.add(this.add.circle(40 * scale, -9 * scale, 6 * scale, sweatColor));
        face.add(this.add.circle(46 * scale, 20 * scale, 4.5 * scale, sweatColor));
        return face;
    }
    showFloodRiskInstructionScreen() {
        this.clearQuestionScreen();
        const sticksOnLeft = Phaser.Math.Between(0, 1) === 0;
        this.floodTaskSides = {
            sticksX: sticksOnLeft ? 230 : 1050,
            treeX: sticksOnLeft ? 1050 : 230
        };
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.drawStormCloud(1035, 120, 0.55);
        this.addQuestionObject(this.createStaticHumanAvatar(470, 345, '', 0.95, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 345, '', 0.88, 3368652, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(810, 345, '', 0.8, 3381606, 0, false));
        this.addQuestionObject(this.add.text(640, 575, 'It is highly likely the location will flood when the rainy season arrives in a few weeks.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.createNextButton(640, 675, 'Next', () => {
            this.showFloodPreparationQuestion();
        });
    }
    drawStormCloud(x, y, scale = 1) {
        const cloudColor = 7305088;
        const darkCloudColor = 5265504;
        const rainColor = 4161471;
        this.addQuestionObject(this.add.circle(x - 55 * scale, y + 5 * scale, 34 * scale, cloudColor));
        this.addQuestionObject(this.add.circle(x - 20 * scale, y - 15 * scale, 45 * scale, cloudColor));
        this.addQuestionObject(this.add.circle(x + 30 * scale, y - 10 * scale, 40 * scale, darkCloudColor));
        this.addQuestionObject(this.add.circle(x + 70 * scale, y + 8 * scale, 30 * scale, cloudColor));
        this.addQuestionObject(this.add.rectangle(x + 8 * scale, y + 18 * scale, 150 * scale, 42 * scale, cloudColor));
        for (let i = 0; i < 6; i += 1) {
            const rain = this.add.line(x - 65 * scale + i * 26 * scale, y + 65 * scale, 0, 0, -8 * scale, 28 * scale, rainColor);
            rain.setLineWidth(3 * scale);
            this.addQuestionObject(rain);
        }
    }
    drawStickPile(x, y) {
        const stickColor = 9132587;
        for (let i = 0; i < 8; i += 1) {
            const stick = this.add.rectangle(x + Phaser.Math.Between(-35, 35), y + Phaser.Math.Between(-20, 20), 95, 9, stickColor);
            stick.setAngle(Phaser.Math.Between(-35, 35));
            stick.setStrokeStyle(1, 4860434);
            this.addQuestionObject(stick);
        }
    }
    drawFloodTaskTree(x, y) {
        this.addQuestionObject(this.add.rectangle(x, y + 75, 36, 130, 10183465));
        this.addQuestionObject(this.add.circle(x, y - 40, 78, 3112242));
        this.addQuestionObject(this.add.circle(x - 55, y, 58, 4037186));
        this.addQuestionObject(this.add.circle(x + 55, y, 58, 4037186));
        this.addQuestionObject(this.add.circle(x, y + 35, 64, 3116856));
        const fruitPositions = [
            [
                -42,
                -62
            ],
            [
                -12,
                -78
            ],
            [
                18,
                -70
            ],
            [
                46,
                -48
            ],
            [
                -68,
                -18
            ],
            [
                -35,
                -10
            ],
            [
                -2,
                -22
            ],
            [
                32,
                -8
            ],
            [
                62,
                6
            ],
            [
                -52,
                28
            ],
            [
                -18,
                36
            ],
            [
                16,
                32
            ],
            [
                48,
                42
            ]
        ];
        fruitPositions.forEach(position => {
            const fruit = this.add.circle(x + position[0], y + position[1], 6, 11674146);
            fruit.setStrokeStyle(1, 0);
            this.addQuestionObject(fruit);
        });
    }
    showFloodPreparationQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.drawFloodTaskTree(this.floodTaskSides.treeX, 165);
        this.drawStickPile(this.floodTaskSides.sticksX, 275);
        this.addQuestionObject(this.createStaticHumanAvatar(470, 275, '', 0.82, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 275, '', 0.76, 3368652, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(810, 275, '', 0.7, 3381606, 0, false));
        this.addQuestionObject(this.add.text(640, 400, 'Should the group spend the rest of the day looking for more food to eat or preparing the location to withstand flooding in a few weeks?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The group should spend the rest of the day looking for more food to eat.',
            'The group should spend the rest of the day preparing the location to withstand flooding in a few weeks.'
        ]);
        this.createAnswerButton(640, 500, answers[0], 'floodPreparationChoice');
        this.createAnswerButton(640, 580, answers[1], 'floodPreparationChoice');

        ;
    }
    showPersonDInstructionScreen(nextQuestion = () => this.showPersonDShareQuestion()) {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 165, 'A new person (Person D) wanders into the group\u2019s location and begs for food. The new person is peaceful and not threatening.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.addQuestionObject(this.createStaticHumanAvatar(240, 375, 'Person A', 0.78, 13382451, 0, false));
        this.addQuestionObject(this.createStaticHumanAvatar(395, 355, 'Person B', 0.72, 3368652, 0, false));
        this.drawSmallFire(395, 525, 0.75);
        this.addQuestionObject(this.createStaticHumanAvatar(535, 390, 'Person C', 0.66, 3381606, 0, false));
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(1050, 355, 'Person D', 0.66, 9067076));
        this.createNextButton(640, 675, 'Next', () => {
            nextQuestion();
        });
    }
    showPersonDShareQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(640, 125, 'Person D', 0.82, 9067076));
        this.addQuestionObject(this.add.rectangle(640, 425, 1120, 300, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 325, 'Should the members of the group share their food with Person D or ask Person D to get food elsewhere?', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'Members of the group should share their food with Person D.',
            'Members of the group should ask Person D to get food elsewhere.'
        ]);
        this.createAnswerButton(640, 435, answers[0], 'personDShareChoice');
        this.createAnswerButton(640, 525, answers[1], 'personDShareChoice');

        ;
    }
    createPersonDOutstretchedAvatar(x, y, label, scale, shirtColor) {
        const person = this.add.container(x, y);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-14 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(-2 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(-6 * scale, -35 * scale, 3 * scale, 9 * scale, 10181678));
        person.add(this.add.arc(-6 * scale, -25 * scale, 9 * scale, 20, 160, false, 0));
        person.add(this.add.rectangle(0, 8 * scale, 42 * scale, 60 * scale, shirtColor));
        person.add(this.add.rectangle(-42 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(8));
        person.add(this.add.rectangle(30 * scale, 13 * scale, 9 * scale, 48 * scale, skinColor).setAngle(-12));
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 13 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 13 * scale, 48 * scale, pantsColor));
        person.add(this.add.text(0, 130 * scale, label, {
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5));
        return person;
    }
    drawSmallFire(x, y, scale = 1) {
        this.addQuestionObject(this.add.rectangle(x, y + 35 * scale, 120 * scale, 16 * scale, 9132587)).setAngle(8);
        this.addQuestionObject(this.add.rectangle(x, y + 35 * scale, 120 * scale, 16 * scale, 9132587)).setAngle(-8);
        this.addQuestionObject(this.add.triangle(x, y, 0, 55 * scale, 28 * scale, -28 * scale, 56 * scale, 55 * scale, 16742912));
        this.addQuestionObject(this.add.triangle(x, y + 8 * scale, 0, 38 * scale, 19 * scale, -20 * scale, 38 * scale, 38 * scale, 16765514));
    }
    showPersonDEmpathyQuestion() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.createPersonDOutstretchedAvatar(640, 125, 'Person D', 0.82, 9067076));
        this.addQuestionObject(this.add.rectangle(640, 450, 1120, 350, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 325, 'Should empathy toward Person D guide the group’s decision about whether to give Person D food?', {
            fontSize: '26px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'Empathy should guide the decision.',
            'Empathy should not guide the decision.'
        ]);
        this.createAnswerButton(640, 445, answers[0], 'personDEmpathyChoice');
        this.createAnswerButton(640, 540, answers[1], 'personDEmpathyChoice');

        ;
    }
    showCooperationCompetitionInstructionScreen() {
        this.clearQuestionScreen();
        const cooperativeOnLeft = Phaser.Math.Between(0, 1) === 0;
        const leftX = 345;
        const rightX = 935;
        const panelY = 370;
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 560, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 120, 'Most people cooperate with others sometimes and compete with others sometimes.', {
            fontSize: '27px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 900 },
            lineSpacing: 6
        }).setOrigin(0.5));
        this.drawCooperationCompetitionPanel(cooperativeOnLeft ? leftX : rightX, panelY, true);
        this.drawCooperationCompetitionPanel(cooperativeOnLeft ? rightX : leftX, panelY, false);
        this.createNextButton(640, 675, 'Next', () => {
            this.showCooperationCompetitionQuestion();
        });
    }
    drawCooperationCompetitionPanel(x, y, cooperative) {
        const panel = this.add.rectangle(x, y, 500, 330, 16316664);
        panel.setStrokeStyle(3, 0);
        panel.setDepth(1);
        this.addQuestionObject(panel);
        if (cooperative) {
            this.addQuestionObject(this.createPanelAvatar(x - 85, y + 45, '', 0.72, 13382451, 'smile', 'right'));
            this.addQuestionObject(this.createPanelAvatar(x + 10, y + 45, '', 0.72, 3381606, 'smile', 'left'));
            this.addQuestionObject(this.createPanelAvatar(x + 135, y + 45, '', 0.72, 3368652, 'smile', 'down'));
            const handshake = this.add.circle(x - 35, y + 42, 5, 11893327);
            handshake.setDepth(20);
            this.addQuestionObject(handshake);
        } else {
            this.addQuestionObject(this.createPanelAvatar(x - 145, y + 45, '', 0.72, 3368652, 'scowl', 'down'));
            this.addQuestionObject(this.createPanelAvatar(x - 35, y + 45, '', 0.72, 13382451, 'scowl', 'right'));
            this.addQuestionObject(this.createPanelAvatar(x + 55, y + 45, '', 0.72, 3381606, 'scowl', 'left'));
            const food = this.add.circle(x + 10, y + 42, 5.5, 11674146);
            food.setStrokeStyle(1, 0);
            food.setDepth(20);
            this.addQuestionObject(food);
        }
    }
    createPanelAvatar(x, y, label, scale, shirtColor, expression, armPose) {
        const person = this.add.container(x, y);
        person.setDepth(10);
        const skinColor = 11893327;
        const hairColor = 7028509;
        const pantsColor = 3355443;
        person.add(this.add.rectangle(0, -18 * scale, 10 * scale, 14 * scale, skinColor));
        person.add(this.add.circle(0, -43 * scale, 24 * scale, skinColor));
        person.add(this.add.ellipse(0, -64 * scale, 46 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(-17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.ellipse(17 * scale, -55 * scale, 12 * scale, 18 * scale, hairColor));
        person.add(this.add.circle(-8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.circle(8 * scale, -43 * scale, 2.7 * scale, 0));
        person.add(this.add.rectangle(0, -35 * scale, 3 * scale, 9 * scale, 10181678));
        if (expression === 'scowl') {
            person.add(this.add.rectangle(-8 * scale, -53 * scale, 13 * scale, 2 * scale, 0).setAngle(18));
            person.add(this.add.rectangle(8 * scale, -53 * scale, 13 * scale, 2 * scale, 0).setAngle(-18));
            const mouth = this.add.graphics();
            mouth.lineStyle(2, 0);
            mouth.beginPath();
            mouth.arc(0, -18 * scale, 9 * scale, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), true);
            mouth.strokePath();
            person.add(mouth);
        } else {
            const mouth = this.add.graphics();
            mouth.lineStyle(2, 0);
            mouth.beginPath();
            mouth.arc(0, -36 * scale, 10 * scale, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
            mouth.strokePath();
            person.add(mouth);
        }
        person.add(this.add.rectangle(0, 8 * scale, 46 * scale, 64 * scale, shirtColor));
        if (armPose === 'right') {
            person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(38 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(-7));
        } else if (armPose === 'left') {
            person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(-38 * scale, -2 * scale, 58 * scale, 9 * scale, skinColor).setAngle(7));
        } else {
            person.add(this.add.rectangle(-32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
            person.add(this.add.rectangle(32 * scale, 10 * scale, 10 * scale, 52 * scale, skinColor));
        }
        person.add(this.add.rectangle(-12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        person.add(this.add.rectangle(12 * scale, 71 * scale, 14 * scale, 48 * scale, pantsColor));
        this.addQuestionObject(person);
        return person;
    }
    showCooperationCompetitionQuestion() {
        this.clearQuestionScreen();
        const fixedFood = this.getFixedFoodCounts();
        this.addQuestionObject(this.createStaticHumanAvatar(280, 115, 'Person A', 0.78, 13382451, fixedFood.personA));
        this.addQuestionObject(this.createStaticHumanAvatar(640, 115, 'Person B', 0.72, 3368652, fixedFood.personB));
        this.addQuestionObject(this.createStaticHumanAvatar(1000, 115, 'Person C', 0.66, 3381606, fixedFood.personC));
        this.addQuestionObject(this.add.rectangle(640, 455, 1120, 360, 16777215)).setStrokeStyle(4, 0);
        this.addQuestionObject(this.add.text(640, 330, 'Do you think that the people in this group are probably more cooperative or competitive?', {
            fontSize: '28px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 980 },
            lineSpacing: 6
        }).setOrigin(0.5));
        const answers = Phaser.Utils.Array.Shuffle([
            'The people in this group are probably more competitive.',
            'The people in this group are probably more cooperative.'
        ]);
        this.createAnswerButton(640, 455, answers[0], 'cooperationCompetitionChoice');
        this.createAnswerButton(640, 560, answers[1], 'cooperationCompetitionChoice');

        ;
    }
    showSelfInterestRandomizationScreen() {
        if (!this.gameData.respondentRole) {
            this.gameData.selfInterestCondition = 'neutral';
            this.gameData.selfInterestConditionIssue = 'missing_or_invalid_income_third';
            this.gameData.respondentRoleRevealed = false;
            this.showNeutralSelfInterestScreen();
            return;
        }
        this.gameData.selfInterestCondition = this.assignSelfInterestCondition();
        if (this.gameData.selfInterestCondition === 'reveal') {
            this.showRespondentRoleScreen();
        } else {
            this.showNeutralSelfInterestScreen();
        }
    }
    showNeutralSelfInterestScreen() {
        this.gameData.respondentRoleRevealed = false;
        this.showFoodPolicyTransition('Task 4', 'Start again with Persons A, B, and C. Choose your final arrangement.', () => this.startSelfInterestAllocation());
    }
    showRespondentRoleScreen() {
        this.gameData.respondentRoleRevealed = true;
        const respondentRole = this.gameData.respondentRole;
        const fixedFood = this.getFixedFoodCounts();
        const respondentFood = {'Person A': fixedFood.personA, 'Person B': fixedFood.personB, 'Person C': fixedFood.personC}[respondentRole];
        this.showFoodPolicyTransition('Task 4', `Start again with Persons A, B, and C.\n\nFor this task, imagine you are ${respondentRole}. You have ${respondentFood} pieces of food.`, () => this.startSelfInterestAllocation());
    }
    drawSelfInterestStartingRoles(highlightedRole) {
        const fixedFood = this.getFixedFoodCounts();
        const roles = [
            {
                label: 'Person A',
                key: 'personA',
                x: 260,
                scale: 0.82,
                shirtColor: 13382451
            },
            {
                label: 'Person B',
                key: 'personB',
                x: 640,
                scale: 0.76,
                shirtColor: 3368652
            },
            {
                label: 'Person C',
                key: 'personC',
                x: 1020,
                scale: 0.7,
                shirtColor: 3381606
            }
        ];
        roles.forEach(role => {
            if (role.label === highlightedRole) {
                const outline = this.add.rectangle(role.x, 405, 270, 345, 16777215, 0);
                outline.setStrokeStyle(6, 1797946);
                this.addQuestionObject(outline);
            }
            this.addQuestionObject(this.createStaticHumanAvatar(role.x, 350, role.label, role.scale, role.shirtColor, fixedFood[role.key]));
        });
    }
    startSelfInterestAllocation(stage = 'final') {
        this.allocationStage = stage;
        this.allocationStartedAt = Date.now();
        const fixedFood = this.getFixedFoodCounts();
        this.selfInterestCounts = {
            'Person A': fixedFood.personA,
            'Person B': fixedFood.personB,
            'Person C': fixedFood.personC
        };
        this.selfInterestEqualApplied = false;
        this.selfInterestPartialApplied = false;
        this.selfInterestAllocationSource = 'starting_distribution';
        this.showSelfInterestAllocationTask();
    }
    showSelfInterestAllocationTask() {
        this.clearQuestionScreen();
        this.clearGameObjects();
        const fixedFood = this.getFixedFoodCounts();
        const isInitial = this.allocationStage === 'initial';
        const revealRole = !isInitial && this.gameData.respondentRoleRevealed ? this.gameData.respondentRole : null;
        this.addQuestionObject(this.add.rectangle(640, 360, 1240, 700, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 24, 'Arrange the food as you think best.', {
            fontSize: '29px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1150 }
        }).setOrigin(0.5, 0));
        this.addQuestionObject(this.add.text(640, 70, 'Each person needs 5 pieces to survive.', {
            fontSize: '20px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1120 }
        }).setOrigin(0.5, 0));
        const statusLine = revealRole ? `You are ${ revealRole } (outlined in green).` : '';
        this.addQuestionObject(this.add.text(640, 125, statusLine, {
            fontSize: '17px',
            color: revealRole ? '#1b6f3a' : '#555555',
            align: 'center',
            wordWrap: { width: 1060 }
        }).setOrigin(0.5, 0));
        const roles = [
            {
                label: 'Person A',
                x: 260,
                scale: 0.9,
                shirtColor: 13382451
            },
            {
                label: 'Person B',
                x: 640,
                scale: 0.84,
                shirtColor: 3368652
            },
            {
                label: 'Person C',
                x: 1020,
                scale: 0.78,
                shirtColor: 3381606
            }
        ];
        this.selfInterestBaselineY = 330;
        this.selfInterestDropZones = {};
        this.selectedSelfInterestFood = null;
        this.input.dragDistanceThreshold = 6;
        this.selfInterestCountTexts = {};
        roles.forEach(role => {
            if (role.label === revealRole) {
                const outline = this.add.rectangle(role.x, 350, 270, 390, 16777215, 0);
                outline.setStrokeStyle(6, 1797946);
                this.addQuestionObject(outline);
            }
            this.addQuestionObject(this.createStaticHumanAvatar(role.x, this.selfInterestBaselineY, role.label, role.scale, role.shirtColor, 0));
            const dropZone = this.add.zone(role.x, 365, 240, 330).setRectangleDropZone(240, 330);
            dropZone.setInteractive({useHandCursor: true});
            dropZone.on('pointerup', () => {
                if (this.selectedSelfInterestFood && !this.selectedSelfInterestFood.wasDragged) this.moveSelfInterestFood(this.selectedSelfInterestFood, role.label);
            });
            this.selfInterestDropZones[role.label] = dropZone;
            this.addQuestionObject(dropZone);
            const countText = this.add.text(role.x, 510, '', {
                fontSize: '20px',
                color: '#000000'
            }).setOrigin(0.5);
            this.selfInterestCountTexts[role.label] = countText;
            this.addQuestionObject(countText);
        });
        this.selfInterestSummaryText = this.add.text(640, 555, '', {
            fontSize: '21px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1050 }
        }).setOrigin(0.5);
        this.addQuestionObject(this.selfInterestSummaryText);
        this.selfInterestSummaryText.setText('You may drag the food to another person or leave it as it is.');
        this.createSelfInterestFoodPieces();
        this.createSelfInterestActionButton(105, 675, 150, 'Reset', () => {
            this.applySelfInterestAllocation([
                fixedFood.personA,
                fixedFood.personB,
                fixedFood.personC
            ], 'starting_distribution');
        }, 14540253, '#000000');
        this.createSelfInterestActionButton(1070, 675, 270, 'Submit arrangement', () => {
            if (this.allocationStage === 'submitted') return;
            if (isInitial) {
                this.storeFreeAllocation();
                this.allocationStage = 'submitted';
                this.showRedistributionBlock();
            } else {
                this.storeSelfInterestAllocation();
                this.allocationStage = 'submitted';
                this.showManipulationCheck();
            }
        });

        ;
    }
    createSelfInterestFoodPieces() {
        const roles = [
            {
                label: 'Person A',
                amount: this.selfInterestCounts['Person A']
            },
            {
                label: 'Person B',
                amount: this.selfInterestCounts['Person B']
            },
            {
                label: 'Person C',
                amount: this.selfInterestCounts['Person C']
            }
        ];
        this.selfInterestFoods = [];
        roles.forEach(role => {
            for (let index = 0; index < role.amount; index += 1) {
                const food = this.add.circle(0, 0, 7, 11674146);
                food.setStrokeStyle(1, 0);
                food.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains, { useHandCursor: true });
                food.setDepth(20);
                food.assignedPerson = role.label;
                this.input.setDraggable(food);
                food.on('pointerdown', () => { food.wasDragged = false; });
                food.on('pointerup', () => {
                    if (food.wasDragged) return;
                    if (this.selectedSelfInterestFood && this.selectedSelfInterestFood !== food && this.selectedSelfInterestFood.assignedPerson !== food.assignedPerson) {
                        this.moveSelfInterestFood(this.selectedSelfInterestFood, food.assignedPerson);
                    } else {
                        this.clearSelfInterestFoodSelection();
                        this.selectedSelfInterestFood = food;
                        food.setStrokeStyle(3, 0x0066cc);
                        this.selfInterestSummaryText.setText('You may drag the food to another person or leave it as it is.');
                    }
                });
                food.on('dragstart', () => {
                    this.clearSelfInterestFoodSelection();
                    food.wasDragged = true;
                    food.setDepth(100);
                });
                food.on('drag', (pointer, dragX, dragY) => {
                    food.x = dragX;
                    food.y = dragY;
                });
                food.on('dragend', () => {
                    let destination = null;
                    Object.keys(this.selfInterestDropZones).forEach(roleLabel => {
                        const bounds = this.selfInterestDropZones[roleLabel].getBounds();
                        if (Phaser.Geom.Rectangle.Contains(bounds, food.x, food.y)) {
                            destination = roleLabel;
                        }
                    });
                    this.moveSelfInterestFood(food, destination);
                    food.setDepth(20);
                });
                this.selfInterestFoods.push(food);
                this.addQuestionObject(food);
            }
        });
        this.refreshSelfInterestFoodPositions();
    }
    clearSelfInterestFoodSelection() {
        if (this.selectedSelfInterestFood) this.selectedSelfInterestFood.setStrokeStyle(1, 0);
        this.selectedSelfInterestFood = null;
        this.selfInterestSummaryText.setText('You may drag the food to another person or leave it as it is.');
    }
    moveSelfInterestFood(food, destination) {
        if (destination && destination !== food.assignedPerson) {
            this.selfInterestCounts[food.assignedPerson] -= 1;
            food.assignedPerson = destination;
            this.selfInterestCounts[destination] += 1;
            this.selfInterestEqualApplied = false;
            this.selfInterestPartialApplied = false;
            this.selfInterestAllocationSource = 'manual';
        }
        this.clearSelfInterestFoodSelection();
        this.refreshSelfInterestFoodPositions();
    }
    refreshSelfInterestFoodPositions() {
        const basketPositions = {
            'Person A': {
                x: 260 + 39 * 0.9,
                y: this.selfInterestBaselineY + 31 * 0.9,
                scale: 0.9
            },
            'Person B': {
                x: 640 + 39 * 0.84,
                y: this.selfInterestBaselineY + 31 * 0.84,
                scale: 0.84
            },
            'Person C': {
                x: 1020 + 39 * 0.78,
                y: this.selfInterestBaselineY + 31 * 0.78,
                scale: 0.78
            }
        };
        const pileCounts = {
            'Person A': 0,
            'Person B': 0,
            'Person C': 0
        };
        this.selfInterestFoods.forEach(food => {
            const roleLabel = food.assignedPerson;
            const pilePosition = pileCounts[roleLabel];
            const basket = basketPositions[roleLabel];
            pileCounts[roleLabel] += 1;
            food.x = basket.x + (pilePosition % 3 - 1) * 15 * basket.scale;
            food.y = basket.y - 6 * basket.scale + Math.floor(pilePosition / 3) * 13 * basket.scale;
        });
        Object.keys(this.selfInterestCountTexts).forEach(roleLabel => {
            const amount = this.selfInterestCounts[roleLabel];
            this.selfInterestCountTexts[roleLabel].setText(`${ amount } ${ amount === 1 ? 'piece' : 'pieces' }`);
        });
    }
    applySelfInterestAllocation(allocation, source) {
        this.clearSelfInterestFoodSelection();
        const totalAssigned = allocation.reduce((sum, amount) => sum + amount, 0);
        if (totalAssigned !== this.selfInterestFoods.length || allocation.some(amount => !Number.isInteger(amount) || amount < 0)) {
            throw new Error('Invalid self-interest allocation preset.');
        }
        const roleLabels = [
            'Person A',
            'Person B',
            'Person C'
        ];
        let foodIndex = 0;
        roleLabels.forEach((roleLabel, roleIndex) => {
            this.selfInterestCounts[roleLabel] = allocation[roleIndex];
            for (let count = 0; count < allocation[roleIndex]; count += 1) {
                this.selfInterestFoods[foodIndex].assignedPerson = roleLabel;
                foodIndex += 1;
            }
        });
        this.selfInterestAllocationSource = source;
        this.selfInterestEqualApplied = source === 'equal_button';
        this.selfInterestPartialApplied = source === 'partial_button';
        this.refreshSelfInterestFoodPositions();
    }
    buildSelfInterestPartialAllocation() {
        return this.buildSurplusOnlyPartialAllocation();
    }
    createSelfInterestActionButton(centerX, centerY, width, label, callback, fillColor = 0, textColor = '#ffffff') {
        const button = this.add.rectangle(centerX, centerY, width, 52, fillColor);
        button.setStrokeStyle(2, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(1000);
        const text = this.add.text(centerX, centerY, label, {
            fontSize: '18px',
            color: textColor,
            align: 'center',
            wordWrap: { width: width - 18 }
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(1001);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        button.on('pointerdown', callback);
        text.on('pointerdown', callback);
    }
    storeSelfInterestAllocation() {
        const fixedFood = this.getFixedFoodCounts();
        const startingAllocation = [
            fixedFood.personA,
            fixedFood.personB,
            fixedFood.personC
        ];
        const finalAllocation = [
            this.selfInterestCounts['Person A'],
            this.selfInterestCounts['Person B'],
            this.selfInterestCounts['Person C']
        ];
        const survivors = finalAllocation.filter(amount => amount >= 5).length;
        const totalMoved = finalAllocation.reduce((sum, amount, index) => sum + Math.abs(amount - startingAllocation[index]), 0) / 2;
        this.gameData.selfInterestAllocationFinal = {
            personA: finalAllocation[0],
            personB: finalAllocation[1],
            personC: finalAllocation[2]
        };
        this.gameData.selfInterestAllocationSurvivors = survivors;
        this.gameData.selfInterestAllocationGini = this.calculateAllocationGini(finalAllocation);
        this.gameData.selfInterestAllocationClassification = this.classifySelfInterestAllocation(finalAllocation, startingAllocation);
        this.gameData.selfInterestAllocationTotalMoved = totalMoved;
        this.gameData.selfInterestAllocationMethod = this.selfInterestAllocationSource;
        this.gameData.selfInterestEqualButtonUsed = this.selfInterestEqualApplied;
        this.gameData.selfInterestPartialButtonUsed = this.selfInterestPartialApplied;
        const roleIndex = {
            'Person A': 0,
            'Person B': 1,
            'Person C': 2
        }[this.gameData.respondentRole];
        if (Number.isInteger(roleIndex)) {
            this.gameData.selfInterestOwnStartingFood = startingAllocation[roleIndex];
            this.gameData.selfInterestOwnFinalFood = finalAllocation[roleIndex];
            this.gameData.selfInterestOwnChange = finalAllocation[roleIndex] - startingAllocation[roleIndex];
        }
    }
    classifySelfInterestAllocation(finalAllocation, startingAllocation) {
        const allocationsMatch = (left, right) => left.every((amount, index) => amount === right[index]);
        if (allocationsMatch(finalAllocation, startingAllocation)) {
            return 'starting_distribution';
        }
        if (finalAllocation.every(amount => amount === finalAllocation[0])) {
            return 'equal_distribution';
        }
        if (allocationsMatch(finalAllocation, this.buildSelfInterestPartialAllocation())) {
            return 'acquisition_priority_maximum_survival';
        }
        const maximumSurvivors = Math.min(finalAllocation.length, Math.floor(finalAllocation.reduce((sum, amount) => sum + amount, 0) / 5));
        const survivors = finalAllocation.filter(amount => amount >= 5).length;
        if (survivors === maximumSurvivors) {
            return 'other_maximum_survival';
        }
        return 'other_distribution';
    }
    calculateAllocationGini(values) {
        const total = values.reduce((sum, amount) => sum + amount, 0);
        if (values.length === 0 || total === 0) {
            return 0;
        }
        let absoluteDifferenceSum = 0;
        values.forEach(left => {
            values.forEach(right => {
                absoluteDifferenceSum += Math.abs(left - right);
            });
        });
        return Number((absoluteDifferenceSum / (2 * values.length * total)).toFixed(4));
    }
    notifyQualtricsComplete(saveStatus) {
        if (!this.qualtricsParentOrigin) {
            console.warn('Qualtrics completion message was not sent because parentOrigin is missing or invalid.');
            return false;
        }
        if (!window.opener || window.opener.closed) {
            console.warn('Qualtrics completion message was not sent because the survey window is unavailable.');
            return false;
        }
        const completionMessage = {
            type: 'survival-game-complete',
            gameId: this.gameData.gameId,
            qualtricsId: this.gameData.qualtricsId,
            saveStatus: saveStatus,
            summary: {
                economicPrincipleOrder: this.gameData.economicPrincipleOrder,
                redistributionTaskOrder: this.gameData.redistributionTaskOrder,
                redistributionBlocksCompleted: this.gameData.redistributionBlocksCompleted,
                freeAllocationFinal: this.gameData.freeAllocationFinal,
                freeAllocationGini: this.gameData.freeAllocationGini,
                freeAllocationSurvivors: this.gameData.freeAllocationSurvivors,
                freeAllocationTotalMoved: this.gameData.freeAllocationTotalMoved,
                freeAllocationDurationMs: this.gameData.freeAllocationDurationMs,
                redistributionFeasibility: this.gameData.redistributionFeasibility,
                equalDivisionOutcomeChoice: this.gameData.equalDivisionOutcomeChoice,
                equalDivisionOutcomePassed: this.gameData.equalDivisionOutcomePassed,
                manipulationCheckChoice: this.gameData.manipulationCheckChoice,
                manipulationCheckPassed: this.gameData.manipulationCheckPassed,
                condition: this.gameData.condition,
                gameVersion: this.gameData.gameVersion,
                respondentDecile: this.gameData.respondentDecile,
                respondentIncomeThird: this.gameData.respondentIncomeThird,
                respondentRole: this.gameData.respondentRole,
                selfInterestCondition: this.gameData.selfInterestCondition,
                selfInterestAllocationFinal: this.gameData.selfInterestAllocationFinal,
                selfInterestOwnChange: this.gameData.selfInterestOwnChange,
                equalDivisionFinal: this.gameData.equalDivisionFinal,
                partialRedistributionFinal: this.gameData.partialRedistributionFinal
            }
        };
        window.opener.postMessage(completionMessage, this.qualtricsParentOrigin);
        this.gameData.completionMessageSent = true;
        console.log('Qualtrics completion message sent:', completionMessage);
        return true;
    }
    saveGameDataToGoogleSheets() {
        const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxm-CcPybco-VELZbg42X4gnxIH2czlAHBXRoQGN-HU4ExkAZ1PVmL60ki03yG03q9O/exec';
        this.gameData.saveStatus = 'attempted';
        console.log('GOOGLE SCRIPT URL:', googleScriptUrl);
        console.log('DATA BEING SENT:', JSON.stringify(this.gameData));
        return fetch(googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            body: JSON.stringify(this.gameData)
        });
    }
    showFinalGameScreen() {
        this.clearQuestionScreen();
        this.gameData.gameEndTime = new Date().toISOString();
        this.gameData.totalDurationMs = new Date(this.gameData.gameEndTime) - new Date(this.gameData.gameStartTime);
        this.addQuestionObject(this.add.rectangle(640, 360, 1000, 500, 16777215).setStrokeStyle(4, 0));
        const statusText = this.add.text(640, 270, 'Thank you for completing the Survival Task.\n\nPlease wait while we save your answers.', {
            fontSize: '30px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 850 },
            lineSpacing: 10
        }).setOrigin(0.5);
        this.addQuestionObject(statusText);
        const showCloseButton = () => {
            const closeButton = this.add.rectangle(640, 540, 360, 65, 0);
            closeButton.setInteractive({ useHandCursor: true });
            closeButton.setDepth(50);
            const closeText = this.add.text(640, 540, 'Return to survey', {
                fontSize: '28px',
                color: '#ffffff'
            }).setOrigin(0.5);
            closeText.setInteractive({ useHandCursor: true });
            closeText.setDepth(51);
            this.addQuestionObject(closeButton);
            this.addQuestionObject(closeText);
            const closeGameTab = () => {
                window.close();
                this.addQuestionObject(this.add.text(640, 630, 'If this tab stays open, close it and return to the survey.', {
                    fontSize: '22px',
                    color: '#000000',
                    align: 'center',
                    wordWrap: { width: 850 }
                }).setOrigin(0.5));
            };
            closeButton.on('pointerdown', closeGameTab);
            closeText.on('pointerdown', closeGameTab);
        };
        /*
     * Report completion immediately. This does not
     * contain or enforce any minimum-duration rule.
     */
        this.gameData.saveStatus = 'attempted';
        this.notifyQualtricsComplete('attempted');
        this.saveGameDataToGoogleSheets().then(() => {
            this.gameData.saveStatus = 'request_sent';
            this.notifyQualtricsComplete('request_sent');
            statusText.setText('Your task is complete.\nReturn to the survey to finish.');
            showCloseButton();
            console.log('Google Sheets save request sent.');
        }).catch(error => {
            this.gameData.saveStatus = 'request_failed';
            this.notifyQualtricsComplete('request_failed');
            statusText.setText('We could not finish saving your answers.\nReturn to the survey and notify the researcher.');
            showCloseButton();
            console.error('Google Sheets save failed:', error);
        });
        console.log('FINAL GAME DATA:', this.gameData);
    }
    createAnswerButton(centerX, centerY, label, variableName) {
        const paddingX = 24;
        const paddingY = 14;
        const text = this.add.text(centerX, centerY, label, {
            fontSize: '22px',
            color: '#000000',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5);
        const button = this.add.rectangle(centerX, centerY, text.width + paddingX * 2, text.height + paddingY * 2, 14540253);
        button.setStrokeStyle(2, 0);
        button.setInteractive(new Phaser.Geom.Rectangle(-(button.width + 40) / 2, -(button.height + 30) / 2, button.width + 40, button.height + 30), Phaser.Geom.Rectangle.Contains);
        button.setDepth(1);
        text.setDepth(2);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        if (!this.answerButtons[variableName]) {
            this.answerButtons[variableName] = [];
        }
        this.answerButtons[variableName].push(button);
        button.on('pointerdown', () => {
            this.answerButtons[variableName].forEach(choice => {
                choice.setStrokeStyle(2, 0);
            });
            button.setStrokeStyle(5, 0);
            this.gameData[variableName] = label;
            console.log('Saved answer:', variableName, label);
            if (this.currentNextButton) {
                this.currentNextButton.destroy();
                this.currentNextButton = null;
            }
            if (this.currentNextText) {
                this.currentNextText.destroy();
                this.currentNextText = null;
            }
            const addNext = (callback, y = 675) => {
                this.createNextButton(640, y, 'Next', callback);
            };
            if (variableName === 'totalFoodEstimate') {
                addNext(() => this.showFoodPolicyTransition('Task 1', 'First, choose how to arrange the food among the members of the group.', () => this.startSelfInterestAllocation('initial')));
             } else if (variableName === 'equalDivisionOutcomeChoice') {
                this.gameData.equalDivisionOutcomeChoice = Number.parseInt(label, 10);
                this.gameData.equalDivisionOutcomePassed = this.gameData.equalDivisionOutcomeChoice === (this.gameData.condition === 'sufficiency' ? 3 : 0);
                addNext(() => {
                    this.showGroupDistributionPreferenceQuestion();
                });
            } else if (variableName === 'groupDistributionPreference') {
                addNext(() => this.completeRedistributionBlock('equal'));
            } else if (variableName === 'partialRedistributionPreference') {
                addNext(() => {
                    this.completeRedistributionBlock('partial');
                });
            } else if (variableName === 'manipulationCheckChoice') {
                this.gameData.manipulationCheckChoice = { Yes: 'yes', No: 'no', 'Not sure': 'not_sure' }[label];
                this.gameData.manipulationCheckPassed = this.gameData.manipulationCheckChoice ===
                    (this.gameData.condition === 'sufficiency' ? 'yes' : 'no');
                addNext(() => this.showFinalGameScreen());
            } else if (variableName === 'redistributionFeasibility') {
                addNext(() => this.showSocialContractQuestion());
            } else if (variableName === 'socialContractGuarantee') {
                addNext(() => {
                    this.showSurvivalRedistributionQuestion();
                });
            } else if (this.gameData.economicPrincipleOrder?.includes(variableName)) {
                addNext(() => this.showEconomicPrinciple(this.economicPrincipleIndex + 1));
            }
        });
    }
    getButtonStyle() {
        return {
            width: 220,
            height: 60,
            fontSize: '28px',
            fillColor: 0,
            textColor: '#ffffff'
        };
    }
    showNextTaskButtonAt(x, y, callback) {
        const buttonY = 685;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(50);
        const text = this.add.text(x, buttonY, 'Next', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(51);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    showNextTaskButton(callback) {
        const buttonY = 685;
        const button = this.add.rectangle(640, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(50);
        const text = this.add.text(640, buttonY, 'Next', {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(51);
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    createGameNextButton(x, y, label, callback) {
        const buttonY = 685;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        const text = this.add.text(x, buttonY, label, {
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);
        button.setDepth(1);
        text.setDepth(2);
        this.addGameObject(button);
        this.addGameObject(text);
        button.on('pointerdown', callback);
        text.on('pointerdown', callback);
    }
    createNextButton(x, y, label, callback) {
        const buttonY = y;
        const button = this.add.rectangle(x, buttonY, 160, 55, 0);
        button.setInteractive({ useHandCursor: true });
        button.setDepth(1000);
        const text = this.add.text(x, buttonY, label, {
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);
        text.setInteractive({ useHandCursor: true });
        text.setDepth(1001);
        this.currentNextButton = button;
        this.currentNextText = text;
        this.addQuestionObject(button);
        this.addQuestionObject(text);
        const goNext = () => {
            callback();
        };
        button.on('pointerdown', goNext);
        text.on('pointerdown', goNext);
    }
    addQuestionObject(object) {
        this.questionObjects.push(object);
        return object;
    }
    addGameObject(object) {
        this.gameObjects.push(object);
        return object;
    }
    clearQuestionScreen() {
        this.clearInstructionReview();
        if (!this.questionObjects) {
            return;
        }
        this.questionObjects.forEach(object => {
            if (object && object.destroy) {
                object.destroy();
            }
        });
        this.questionObjects = [];
        this.answerButtons = [];
    }
    clearGameObjects() {
        if (!this.gameObjects) {
            return;
        }
        this.gameObjects.forEach(object => {
            if (object && object.destroy) {
                object.destroy();
            }
        });
        this.gameObjects = [];
    }

    showFoodPolicyTransition(title, detail, next) {
        this.clearQuestionScreen();
        this.clearGameObjects();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 180, title, {fontSize: '32px', color: '#000000', align: 'center', wordWrap: {width: 980}}).setOrigin(0.5));
        this.addQuestionObject(this.add.text(640, 350, detail, {fontSize: '27px', color: '#000000', align: 'center', wordWrap: {width: 960}}).setOrigin(0.5));
        this.createNextButton(640, 620, 'Continue', () => {
            if (this.isMobileDevice() && this.isPortraitMode()) this.showRotatePhoneScreen(next);
            else next();
        });

        ;
    }
    storeFreeAllocation() {
        const f = this.getFixedFoodCounts();
        const initial = [f.personA, f.personB, f.personC];
        const values = ['Person A', 'Person B', 'Person C'].map(p => this.selfInterestCounts[p]);
        if (values.some(n => !Number.isInteger(n) || n < 0) || values.reduce((a,b) => a+b, 0) !== f.total) throw new Error('Invalid free allocation');
        this.gameData.freeAllocationFinal = {personA: values[0], personB: values[1], personC: values[2]};
        this.gameData.freeAllocationGini = this.calculateAllocationGini(values);
        this.gameData.freeAllocationSurvivors = values.filter(n => n >= 5).length;
        this.gameData.freeAllocationTotalMoved = values.reduce((sum,n,i) => sum + Math.abs(n-initial[i]),0)/2;
        this.gameData.freeAllocationDurationMs = Date.now() - this.allocationStartedAt;
    }
    showManipulationCheck() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 200,
            'Was there enough food in total for all three people to have at least 5 pieces each?',
            {fontSize: '29px', color: '#000000', align: 'center', wordWrap: {width: 960}}
        ).setOrigin(0.5));
        const answers = ['Yes', 'No'];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers.push('Not sure');
        answers.forEach((label, i) => this.createAnswerButton(640, 350 + i * 90, label, 'manipulationCheckChoice'));
    }
    showRedistributionFeasibility() {
        this.clearQuestionScreen();
        this.addQuestionObject(this.add.rectangle(640, 360, 1120, 600, 16777215).setStrokeStyle(3, 0));
        this.addQuestionObject(this.add.text(640, 200, 'Could the food be distributed so everyone has at least 5 pieces?', {fontSize: '29px', color: '#000000', align: 'center', wordWrap: {width: 960}}).setOrigin(0.5));
        const answers = ['Yes', 'No'];
        if (Phaser.Math.Between(0, 1) === 1) answers.reverse();
        answers.forEach((label,i) => this.createAnswerButton(640, 350+i*90, label, 'redistributionFeasibility'));

        ;
    }

    addInstructionReview(text, x = 150, onReview = null) {
        this.reviewInstructionsText = text;
        const button = this.add.rectangle(x, 675, 250, 42, 0xffffff).setStrokeStyle(2, 0x263238).setDepth(2000).setInteractive({useHandCursor: true});
        const label = this.add.text(x, 675, 'Review instructions', {fontFamily: 'Arial', fontSize: '20px', color: '#263238'}).setOrigin(0.5).setDepth(2001);
        this.reviewInstructionsControls = [button, label];
        button.on('pointerdown', () => { if (onReview) onReview(); else this.openInstructionReview(); });
    }
    openInstructionReview() {
        if (this.instructionReviewOverlay) return;
        const disabled = [];
        const visit = object => {
            if (object.input && object.input.enabled) { disabled.push(object); object.input.enabled = false; }
            if (object.list) object.list.forEach(visit);
        };
        this.children.list.forEach(visit);
        const pausedTime = this.time.paused;
        this.time.paused = true;
        const tweens = this.tweens.getTweens().filter(tween => !tween.paused);
        tweens.forEach(tween => tween.pause());
        const objects = [];
        const add = object => { objects.push(object); return object; };
        const shade = add(this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setDepth(10000).setInteractive());
        const stop = (...args) => { const event = args[args.length - 1]; if (event && event.stopPropagation) event.stopPropagation(); };
        ['pointerdown', 'pointerup', 'pointermove'].forEach(event => shade.on(event, stop));
        add(this.add.rectangle(640, 360, 1020, 500, 0xffffff).setStrokeStyle(3, 0x263238).setDepth(10001));
        add(this.add.text(640, 165, 'Review instructions', {fontFamily: 'Arial', fontSize: '30px', color: '#17212b'}).setOrigin(0.5).setDepth(10002));
        add(this.add.text(640, 340, this.reviewInstructionsText, {fontFamily: 'Arial', fontSize: '26px', color: '#17212b', align: 'center', wordWrap: {width: 890}, lineSpacing: 12}).setOrigin(0.5).setDepth(10002));
        const close = add(this.add.rectangle(640, 550, 260, 56, 0x17212b).setDepth(10003).setInteractive({useHandCursor: true}));
        add(this.add.text(640, 550, 'Return to task', {fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'}).setOrigin(0.5).setDepth(10004));
        this.instructionReviewOverlay = {objects, disabled, pausedTime, tweens};
        close.on('pointerup', (...args) => { stop(...args); this.closeInstructionReview(); });
    }
    closeInstructionReview() {
        const overlay = this.instructionReviewOverlay;
        if (!overlay) return;
        this.instructionReviewOverlay = null;
        overlay.objects.forEach(object => object.destroy());
        overlay.disabled.forEach(object => { if (object.active && object.input) object.input.enabled = true; });
        this.time.paused = overlay.pausedTime;
        overlay.tweens.forEach(tween => { if (tween.parent) tween.resume(); });
    }
    clearInstructionReview() {
        this.closeInstructionReview();
        (this.reviewInstructionsControls || []).forEach(object => { if (object.active) object.destroy(); });
        this.reviewInstructionsControls = [];
    }
}
