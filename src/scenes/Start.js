export default class Start extends Phaser.Scene
{
    constructor ()
    {
        super('Start');
    }

    preload () {}

create ()
{
    this.cameras.main.setBackgroundColor('#7fcf7a');

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    const qualtricsId =
        urlParams.get('qualtricsId') ||
        urlParams.get('responseId') ||
        urlParams.get('ResponseID') ||
        urlParams.get('participantId');

    const respondentDecileRaw = Number.parseInt(
        urlParams.get('respondentDecile') ||
        urlParams.get('respondentDecileValue') ||
        '',
        10
    );

    const respondentDecile =
        respondentDecileRaw >= 1 &&
        respondentDecileRaw <= 10
            ? respondentDecileRaw
            : null;

    const respondentIncomeThird = this.normalizeIncomeThird(
        urlParams.get('respondentIncomeThird') ||
        urlParams.get('respondentIncomeThirdValue') ||
        ''
    );

    this.requestedSelfInterestCondition = (
        urlParams.get('selfInterestCondition') ||
        urlParams.get('selfInterestConditionValue') ||
        ''
    ).trim().toLowerCase();

    console.log('gameId:', gameId);
    console.log('qualtricsId:', qualtricsId);
    console.log('respondentDecile:', respondentDecile);
    console.log('respondentIncomeThird:', respondentIncomeThird);

    this.gameData = {
        gameId: gameId,
        qualtricsId: qualtricsId,
        condition: "sufficiency",
        gameVersion: "sufficiency_english_gini",

        gameStartTime: new Date().toISOString(),
        gameEndTime: null,
        totalDurationMs: null,

        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isMobile: this.isMobileDevice(),
        screenOrientation:
            window.innerHeight > window.innerWidth
                ? "portrait"
                : "landscape",

        survivalCheck: null,
        totalFoodEstimate: null,
        perCapitaEstimate: null,
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

        groupDistributionPreference: null,
        partialRedistributionPreference: null,
        distributivePrinciplePriority: null,
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

        respondentRole:
            this.mapIncomeThirdToPerson(
                respondentIncomeThird
            ),

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
    this.selfInterestAllocationSource =
        'starting_distribution';

    this.instructionScreens = [
        'Welcome to the survival game. In this game, a group of three people find themselves lost in an otherwise uninhabited location.',
        'The people have been hunting and gathering food in order to survive. \n \nIf a person does not eat at least 5 pieces of food a day, he will die. \n \nIf a person collects more than 5 pieces of food a day, he can save the remainder for himself the next day.',
        'The location is rich in natural resources, and the group can always collect enough food for everyone to survive.',
        'Person A always collects the most pieces of food per day. \n \nPerson B always collects the median pieces of food per day. \n \nPerson C always collects the least pieces of food per day.',
        'Today, Person A collected 9 pieces of food, Person B collected 6 pieces of food, and Person C collected 3 pieces of food.',
        'Your job is to make decisions on behalf of the group that maximize the survival of the most members of the group. \n \nThe more members of the group you keep alive until the end of the game, the better you will do in the game.'
    ];

    if (this.isMobileDevice())
    {
        this.showRotatePhoneScreen(() => {
            this.showInstructionScreen();
        });
    }
    else
    {
        this.showInstructionScreen();
    }
}

getFixedFoodCounts ()
{
    return {
        personA: 9,
        personB: 6,
        personC: 3,
        total: 18
    };
}

buildSurplusOnlyPartialAllocation ()
{
    const fixedFood = this.getFixedFoodCounts();
    const threshold = 5;

    const allocation = [
        fixedFood.personA,
        fixedFood.personB,
        fixedFood.personC
    ];

    const donors = allocation
        .map((amount, index) => ({
            index,
            surplus: Math.max(0, amount - threshold)
        }))
        .filter(donor => donor.surplus > 0)
        .sort((left, right) =>
            right.surplus - left.surplus ||
            left.index - right.index
        );

    const recipients = allocation
        .map((amount, index) => ({
            index,
            deficit: Math.max(0, threshold - amount),
            startingAmount: amount
        }))
        .filter(recipient => recipient.deficit > 0)
        .sort((left, right) =>
            right.startingAmount - left.startingAmount ||
            left.index - right.index
        );

    recipients.forEach(recipient => {
        let deficit = threshold - allocation[recipient.index];

        donors.forEach(donor => {
            if (deficit <= 0)
            {
                return;
            }

            const availableSurplus = Math.max(
                0,
                allocation[donor.index] - threshold
            );

            const contribution = Math.min(
                availableSurplus,
                deficit
            );

            allocation[donor.index] -= contribution;
            allocation[recipient.index] += contribution;
            deficit -= contribution;
        });
    });

    return allocation;
}

normalizeIncomeThird (incomeThird)
{
    const normalized = String(incomeThird)
        .trim()
        .toLowerCase();

    if (
        ['bottom', 'lower', 'low', '1'].includes(normalized)
    )
    {
        return 'bottom';
    }

    if (
        ['middle', 'mid', '2'].includes(normalized)
    )
    {
        return 'middle';
    }

    if (
        ['top', 'upper', 'high', '3'].includes(normalized)
    )
    {
        return 'top';
    }

    return null;
}

mapIncomeThirdToPerson (incomeThird)
{
    const roleByIncomeThird = {
        bottom: 'Person C',
        middle: 'Person B',
        top: 'Person A'
    };

    return roleByIncomeThird[incomeThird] || null;
}

normalizeParentOrigin (parentOrigin)
{
    try
    {
        const parsedOrigin =
            new URL(parentOrigin);

        if (
            parsedOrigin.protocol !== 'https:' &&
            parsedOrigin.protocol !== 'http:'
        )
        {
            return null;
        }

        return parsedOrigin.origin;
    }
    catch (error)
    {
        return null;
    }
}

assignSelfInterestCondition ()
{
    const validConditions = [
        'reveal',
        'neutral'
    ];

    if (
        validConditions.includes(
            this.requestedSelfInterestCondition
        )
    )
    {
        return this.requestedSelfInterestCondition;
    }

    const assignmentId =
        this.gameData.gameId ||
        this.gameData.qualtricsId;

    const storageKey = assignmentId
        ? `survivalGameSelfInterest:${assignmentId}`
        : null;

    if (storageKey)
    {
        try
        {
            const storedCondition =
                sessionStorage.getItem(storageKey);

            if (
                validConditions.includes(
                    storedCondition
                )
            )
            {
                return storedCondition;
            }
        }
        catch (error)
        {
            // Continue with a new random assignment.
        }
    }

    let randomValue = Math.random();

    if (
        window.crypto &&
        typeof window.crypto.getRandomValues === 'function'
    )
    {
        const randomArray = new Uint32Array(1);

        window.crypto.getRandomValues(randomArray);

        randomValue =
            randomArray[0] / 4294967296;
    }

    const assignedCondition =
        randomValue < 0.5
            ? 'reveal'
            : 'neutral';

    if (storageKey)
    {
        try
        {
            sessionStorage.setItem(
                storageKey,
                assignedCondition
            );
        }
        catch (error)
        {
            // The assignment remains valid without storage.
        }
    }

    return assignedCondition;
}

isMobileDevice ()
{
    return (
        window.innerWidth < 900 ||
        /Mobi|Android|iPhone|iPad/i.test(
            navigator.userAgent
        )
    );
}

isPortraitMode ()
{
    return window.innerHeight > window.innerWidth;
}

showRotatePhoneScreen (nextFunction)
{
    this.clearQuestionScreen();
    this.clearGameObjects();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1080,
            430,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            310,
            'If you are using a cell phone, please rotate your phone sideways to continue.',
            {
                fontSize: '34px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 900
                }
            }
        ).setOrigin(0.5)
    );

    this.createNextButton(
        640,
        520,
        'Continue',
        () => {
            nextFunction.call(this);
        }
    );
}

showInstructionScreen ()
{
    this.cameras.main.setBackgroundColor('#ffffff');
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1000,
            500,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            260,
            145,
            'Instructions',
            {
                fontSize: '36px',
                color: '#000000'
            }
        )
    );

    const instructionStyle = {
        fontSize: '27px',
        color: '#000000',
        wordWrap: {
            width: 760
        },
        lineSpacing: 8
    };

    if (this.instructionIndex === 2)
    {
        instructionStyle.fontStyle = 'bold';
    }

    this.addQuestionObject(
        this.add.text(
            260,
            275,
            this.instructionScreens[
                this.instructionIndex
            ],
            instructionStyle
        )
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.instructionIndex += 1;

            if (
                this.instructionIndex <
                this.instructionScreens.length
            )
            {
                this.showInstructionScreen();
            }
            else
            {
                this.showSurvivalCheckQuestion();
            }
        }
    );
}

showSurvivalCheckQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            900,
            450,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            250,
            175,
            'How many pieces of food does each person need to survive the day?',
            {
                fontSize: '30px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 780
                }
            }
        )
    );

    this.createSurvivalCheckButton(
        640,
        340,
        '3 pieces',
        false
    );

    this.createSurvivalCheckButton(
        640,
        420,
        '5 pieces',
        true
    );

    this.createSurvivalCheckButton(
        640,
        500,
        '7 pieces',
        false
    );
}

createSurvivalCheckButton (
    centerX,
    centerY,
    label,
    isCorrect
)
{
    const paddingX = 24;
    const paddingY = 14;

    const text = this.add.text(
        centerX,
        centerY,
        label,
        {
            fontSize: '24px',
            color: '#000000'
        }
    ).setOrigin(0.5);

    const button = this.add.rectangle(
        centerX,
        centerY,
        text.width + paddingX * 2,
        text.height + paddingY * 2,
        0xdddddd
    );

    button.setStrokeStyle(2, 0x000000);

    button.setInteractive(
        new Phaser.Geom.Rectangle(
            -(button.width + 40) / 2,
            -(button.height + 30) / 2,
            button.width + 40,
            button.height + 30
        ),
        Phaser.Geom.Rectangle.Contains
    );

    button.setDepth(1);
    text.setDepth(2);

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    button.on('pointerdown', () => {
        this.gameData.survivalCheck = label;

        if (isCorrect)
        {
            this.showSurvivalCheckFeedback(
                'Correct.'
            );
        }
        else
        {
            this.showSurvivalCheckFeedback(
                'No, each person needs 5 pieces of food a day to survive.'
            );
        }
    });
}

showSurvivalCheckFeedback (message)
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            900,
            320,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            250,
            290,
            message,
            {
                fontSize: '30px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 780
                }
            }
        )
    );

    this.createNextButton(
        640,
        520,
        'Start Game',
        () => {
            this.startFoodCollectionTask();
        }
    );
}

startFoodCollectionTask ()
{
    this.clearQuestionScreen();
    this.clearGameObjects();

    this.foodCounts = {
        'Person A': 0,
        'Person B': 0,
        'Person C': 0
    };

    // Sky
    this.addGameObject(
        this.add.rectangle(
            640,
            120,
            1280,
            240,
            0xbfefff
        )
    );

    // Distant hills
    this.addGameObject(
        this.add.ellipse(
            250,
            285,
            650,
            220,
            0x6fbd6f
        )
    );

    this.addGameObject(
        this.add.ellipse(
            760,
            285,
            750,
            240,
            0x5ead63
        )
    );

    this.addGameObject(
        this.add.ellipse(
            1120,
            285,
            520,
            200,
            0x78c878
        )
    );

    // Grass field
    this.addGameObject(
        this.add.rectangle(
            640,
            470,
            1280,
            500,
            0x4caf50
        )
    );

    // Grass details
    for (let i = 0; i < 90; i++)
    {
        const grass = this.add.line(
            Phaser.Math.Between(0, 1280),
            Phaser.Math.Between(395, 690),
            0,
            0,
            Phaser.Math.Between(-6, 6),
            Phaser.Math.Between(-18, -8),
            0x2f7d32
        );

        grass.setLineWidth(2);
        this.addGameObject(grass);
    }

    this.addGameObject(
        this.add.text(
            40,
            60,
            'Click each person, then click the tree to collect food for that person. Repeat until all three people have collected food. Select Next to continue.',
            {
                fontSize: '26px',
                color: '#000000',
                wordWrap: {
                    width: 900
                },
                lineSpacing: 6,
                backgroundColor: '#ffffff',
                padding: {
                    x: 12,
                    y: 8
                }
            }
        )
    );

    this.drawTree();

    this.avatars = [];
    this.selectedAvatar = null;
    this.foodCollectionNextShown = false;

    const baselineY = 360;

    const personA = this.createHumanAvatar(
        170,
        baselineY,
        'Person A',
        1.08,
        0xcc3333,
        0
    );

    const personB = this.createHumanAvatar(
        450,
        baselineY,
        'Person B',
        1.00,
        0x3366cc,
        0
    );

    const personC = this.createHumanAvatar(
        730,
        baselineY,
        'Person C',
        1.00,
        0x339966,
        0
    );

    this.avatars.push(
        personA,
        personB,
        personC
    );
}

drawTree ()
{
    this.addGameObject(
        this.add.rectangle(
            1085,
            390,
            50,
            145,
            0x8b5a2b
        )
    );

    this.addGameObject(
        this.add.circle(
            1085,
            245,
            95,
            0x1f7a2e
        )
    );

    this.addGameObject(
        this.add.circle(
            1015,
            300,
            76,
            0x2f9b3a
        )
    );

    this.addGameObject(
        this.add.circle(
            1155,
            300,
            76,
            0x2f9b3a
        )
    );

    this.addGameObject(
        this.add.circle(
            1085,
            350,
            82,
            0x238a35
        )
    );

    this.addGameObject(
        this.add.circle(
            1045,
            235,
            60,
            0x3cad48
        )
    );

    this.addGameObject(
        this.add.circle(
            1128,
            235,
            60,
            0x3cad48
        )
    );

    const fruitPositions = [
        [-45, -75],
        [-15, -90],
        [20, -82],
        [52, -63],
        [-75, -30],
        [-35, -35],
        [0, -45],
        [38, -35],
        [78, -20],
        [-88, 22],
        [-48, 18],
        [-10, 5],
        [28, 12],
        [68, 28],
        [-56, 62],
        [-18, 55],
        [22, 62],
        [58, 70]
    ];

    fruitPositions.forEach(position => {
        const fruit = this.add.circle(
            1085 + position[0],
            285 + position[1],
            7,
            0xb22222
        );

        fruit.setStrokeStyle(1, 0x000000);
        this.addGameObject(fruit);
    });

    const treeClickZone = this.add.zone(
        1085,
        305,
        340,
        380
    );

    treeClickZone.setInteractive({
        useHandCursor: true
    });

    treeClickZone.on(
        'pointerdown',
        () => {
            this.collectFoodFromTree();
        }
    );

    this.addGameObject(treeClickZone);
}

createBasket (x, y, scale)
{
    const basket = this.add.container(x, y);

    const basketColor = 0xb87932;
    const basketDark = 0x5c3517;
    const basketLight = 0xd89a4a;

    const handle = this.add.arc(
        0,
        -11 * scale,
        18 * scale,
        205,
        335,
        true
    );

    handle.setStrokeStyle(
        4 * scale,
        basketDark
    );

    const body = this.add.rectangle(
        0,
        8 * scale,
        34 * scale,
        26 * scale,
        basketColor
    );

    body.setStrokeStyle(
        2 * scale,
        basketDark
    );

    const rim = this.add.rectangle(
        0,
        -4 * scale,
        40 * scale,
        8 * scale,
        basketLight
    );

    rim.setStrokeStyle(
        2 * scale,
        basketDark
    );

    basket.add([
        handle,
        body,
        rim
    ]);

    return basket;
}

createHumanAvatar (
    x,
    y,
    label,
    scale,
    shirtColor,
    startingFood = 0
)
{
    const avatar = this.add.container(x, y);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const pantsColor = 0x333333;

    avatar.add([
        this.add.rectangle(
            0,
            -18 * scale,
            10 * scale,
            14 * scale,
            skinColor
        ),

        this.add.circle(
            0,
            -43 * scale,
            24 * scale,
            skinColor
        ),

        this.add.ellipse(
            0,
            -64 * scale,
            46 * scale,
            18 * scale,
            hairColor
        ),

        this.add.ellipse(
            -17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        ),

        this.add.ellipse(
            17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        ),

        this.add.circle(
            -8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        ),

        this.add.circle(
            8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        ),

        this.add.rectangle(
            0,
            -35 * scale,
            3 * scale,
            9 * scale,
            0x9b5c2e
        ),

        this.add.rectangle(
            0,
            -27 * scale,
            12 * scale,
            2 * scale,
            0x000000
        ),

        this.add.rectangle(
            0,
            8 * scale,
            46 * scale,
            64 * scale,
            shirtColor
        ),

        this.add.rectangle(
            -32 * scale,
            10 * scale,
            10 * scale,
            52 * scale,
            skinColor
        ),

        this.add.rectangle(
            32 * scale,
            10 * scale,
            10 * scale,
            52 * scale,
            skinColor
        ),

        this.createBasket(
            39 * scale,
            31 * scale,
            scale
        ),

        this.add.rectangle(
            -12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        ),

        this.add.rectangle(
            12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        ),

        this.add.text(
            0,
            135 * scale,
            label,
            {
                fontSize: '22px',
                color: '#000000'
            }
        ).setOrigin(0.5)
    ]);

    const selectPerson = () => {
        this.selectAvatar(avatar);
    };

    const clickZones = [
        this.add.zone(
            0,
            -47 * scale,
            70 * scale,
            65 * scale
        ),

        this.add.zone(
            0,
            8 * scale,
            65 * scale,
            78 * scale
        ),

        this.add.zone(
            -32 * scale,
            10 * scale,
            32 * scale,
            70 * scale
        ),

        this.add.zone(
            32 * scale,
            10 * scale,
            32 * scale,
            70 * scale
        ),

        this.add.zone(
            39 * scale,
            31 * scale,
            60 * scale,
            65 * scale
        ),

        this.add.zone(
            -12 * scale,
            75 * scale,
            32 * scale,
            65 * scale
        ),

        this.add.zone(
            12 * scale,
            75 * scale,
            32 * scale,
            65 * scale
        )
    ];

    clickZones.forEach(zone => {
        zone.setInteractive({
            useHandCursor: true
        });

        zone.on(
            'pointerdown',
            selectPerson
        );

        avatar.add(zone);
    });

    avatar.personLabel = label;
    avatar.foodCount = 0;

    for (
        let i = 0;
        i < startingFood;
        i += 1
    )
    {
        avatar.foodCount += 1;

        const position =
            avatar.foodCount - 1;

        const appleX =
            39 +
            ((position % 3) - 1) * 15;

        const appleY =
            25 +
            Math.floor(position / 3) * 13;

        avatar.add(
            this.add.circle(
                appleX,
                appleY,
                5.5,
                0xb22222
            )
        );
    }

    this.addGameObject(avatar);

    return avatar;
}

showFoodCollectionNextButtonIfReady ()
{
    const allThreeCollected =
        this.foodCounts['Person A'] > 0 &&
        this.foodCounts['Person B'] > 0 &&
        this.foodCounts['Person C'] > 0;

    if (
        allThreeCollected &&
        !this.foodCollectionNextShown
    )
    {
        this.foodCollectionNextShown = true;

        this.createGameNextButton(
            640,
            675,
            'Next',
            () => {
                this.showDistributionDisplay();
            }
        );
    }
}

collectFoodFromTree ()
{
    if (!this.selectedAvatar)
    {
        return;
    }

    const person =
        this.selectedAvatar.personLabel;

    if (person === 'Person A')
    {
        this.gameData.treeClicks.personA += 1;

        if (this.foodCounts[person] > 0)
        {
            return;
        }

        this.foodCounts[person] = 9;
        this.gameData.treeFruitCollected.personA = 9;

        this.addFoodToBasket(
            this.selectedAvatar,
            9
        );

        this.showFoodCollectionNextButtonIfReady();
        return;
    }

    if (person === 'Person B')
    {
        this.gameData.treeClicks.personB += 1;

        if (this.foodCounts[person] > 0)
        {
            return;
        }

        this.foodCounts[person] = 6;
        this.gameData.treeFruitCollected.personB = 6;

        this.addFoodToBasket(
            this.selectedAvatar,
            6
        );

        this.showFoodCollectionNextButtonIfReady();
        return;
    }

    if (person === 'Person C')
    {
        this.gameData.treeClicks.personC += 1;

        if (this.foodCounts[person] > 0)
        {
            return;
        }

        this.foodCounts[person] = 3;
        this.gameData.treeFruitCollected.personC = 3;

        this.addFoodToBasket(
            this.selectedAvatar,
            3
        );

        this.showFoodCollectionNextButtonIfReady();
    }
}

addFoodToBasket (avatar, amount)
{
    for (
        let i = 0;
        i < amount;
        i += 1
    )
    {
        avatar.foodCount += 1;

        const position =
            avatar.foodCount - 1;

        const appleX =
            39 +
            ((position % 3) - 1) * 15;

        const appleY =
            25 +
            Math.floor(position / 3) * 13;

        avatar.add(
            this.add.circle(
                appleX,
                appleY,
                5.5,
                0xb22222
            )
        );
    }
}

selectAvatar (avatar)
{
    this.selectedAvatar = avatar;

    this.avatars.forEach(person => {
        if (person.selectionBox)
        {
            person.selectionBox.destroy();
            person.selectionBox = null;
        }

        person.setDepth(10);
    });

    avatar.setDepth(100);

    avatar.selectionBox =
        this.add.rectangle(
            avatar.x,
            avatar.y,
            180,
            260,
            0x000000,
            0
        );

    avatar.selectionBox.setStrokeStyle(
        4,
        0x000000
    );

    avatar.selectionBox.setDepth(99);

    this.addGameObject(
        avatar.selectionBox
    );
}

update () {}

showDistributionDisplay ()
{
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
            color: 0xcc3333,
            foodAmount: fixedFood.personA
        },
        {
            label: 'Person B',
            x: 620,
            scale: 1.00,
            color: 0x3366cc,
            foodAmount: fixedFood.personB
        },
        {
            label: 'Person C',
            x: 1000,
            scale: 0.88,
            color: 0x339966,
            foodAmount: fixedFood.personC
        }
    ];

    people.forEach(person => {
        this.addQuestionObject(
            this.createStaticHumanAvatar(
                person.x,
                baselineY,
                person.label,
                person.scale,
                person.color,
                0
            )
        );

        const selector = this.add.rectangle(
            person.x,
            baselineY,
            210,
            270,
            0xffffff,
            0
        );

        selector.setInteractive({
            useHandCursor: true
        });

        selector.setDepth(5);

        selector.on('pointerdown', () => {
            this.selectPersonForFoodDump(
                person.label
            );
        });

        this.countingPersonSelectors[
            person.label
        ] = selector;

        this.addQuestionObject(selector);

        this.createCountingFoodPieces(
            person.x,
            baselineY,
            person.scale,
            person.foodAmount,
            person.label
        );
    });

    this.blanket = this.add.rectangle(
        640,
        425,
        420,
        115,
        0xd8ecff
    );

    this.blanket.setStrokeStyle(
        4,
        0x335577
    );

    this.blanket.setDepth(1);

    this.blanket.setInteractive({
        useHandCursor: true
    });

    this.blanket.on('pointerdown', () => {
        this.dumpSelectedPersonFoodToBlanket();
    });

    this.addQuestionObject(this.blanket);

    const blanketLabel = this.add.text(
        640,
        425,
        'Blanket',
        {
            fontSize: '24px',
            color: '#000000'
        }
    ).setOrigin(0.5);

    blanketLabel.setDepth(2);
    this.addQuestionObject(blanketLabel);

    this.blanketCounterText = this.add.text(
        640,
        515,
        'Pieces counted: 0',
        {
            fontSize: '26px',
            color: '#000000'
        }
    ).setOrigin(0.5);

    this.blanketCounterText.setDepth(2);
    this.addQuestionObject(
        this.blanketCounterText
    );

    this.countingInstructionText = this.add.text(
        640,
        575,
        'Click a person, then click the blanket to count all of that person\'s food.',
        {
            fontSize: '22px',
            color: '#000000',
            align: 'center',
            wordWrap: {
                width: 980
            }
        }
    ).setOrigin(0.5);

    this.addQuestionObject(
        this.countingInstructionText
    );
}

createCountingFoodPieces (
    avatarX,
    avatarY,
    scale,
    foodAmount,
    personLabel
)
{
    for (let i = 0; i < foodAmount; i++)
    {
        const foodX =
            avatarX +
            (
                39 +
                ((i % 3) - 1) * 15
            ) * scale;

        const foodY =
            avatarY +
            (
                25 +
                Math.floor(i / 3) * 13
            ) * scale;

        const food = this.add.circle(
            foodX,
            foodY,
            7,
            0xb22222
        );

        food.setStrokeStyle(
            1,
            0x000000
        );

        food.setDepth(10);
        food.counted = false;
        food.sourcePerson = personLabel;

        this.countingFoodsByPerson[
            personLabel
        ].push(food);

        this.addQuestionObject(food);
    }
}

getCountingBlanketFoodPosition (index)
{
    const positions = [
        [-150, -25],
        [-115, -25],
        [-80, -25],

        [-150, 10],
        [-115, 10],
        [-80, 10],

        [80, -25],
        [115, -25],
        [150, -25],

        [80, 10],
        [115, 10],
        [150, 10],

        [-150, 45],
        [-115, 45],
        [-80, 45],

        [80, 45],
        [115, 45],
        [150, 45]
    ];

    return positions[index];
}

selectPersonForFoodDump (personLabel)
{
    if (
        this.countingPersonCompleted[
            personLabel
        ]
    )
    {
        this.countingSelectedPerson = null;

        this.countingInstructionText.setText(
            `${personLabel}'s food has already been counted.`
        );

        return;
    }

    this.countingSelectedPerson =
        personLabel;

    Object.entries(
        this.countingPersonSelectors
    ).forEach(([label, selector]) => {
        if (
            this.countingPersonCompleted[
                label
            ]
        )
        {
            selector.setStrokeStyle(
                3,
                0x777777,
                1
            );
        }
        else if (label === personLabel)
        {
            selector.setStrokeStyle(
                5,
                0x1b6f3a,
                1
            );
        }
        else
        {
            selector.setStrokeStyle(
                0,
                0x1b6f3a,
                0
            );
        }
    });

    this.countingInstructionText.setText(
        `${personLabel} selected. Now click the blanket.`
    );
}

dumpSelectedPersonFoodToBlanket ()
{
    if (!this.countingSelectedPerson)
    {
        this.countingInstructionText.setText(
            'Select a person first, then click the blanket.'
        );

        return;
    }

    const selectedPerson =
        this.countingSelectedPerson;

    const remainingFood =
        this.countingFoodsByPerson[
            selectedPerson
        ].filter(food => !food.counted);

    if (remainingFood.length === 0)
    {
        this.countingSelectedPerson = null;

        this.countingInstructionText.setText(
            `${selectedPerson}'s food has already been counted.`
        );

        return;
    }

    this.gameData.totalFoodCountPersonDumps += 1;

    remainingFood.forEach(food => {
        const blanketPosition =
            this.getCountingBlanketFoodPosition(
                this.blanketFoodCount
            );

        food.counted = true;

        food.x =
            this.blanket.x +
            blanketPosition[0];

        food.y =
            this.blanket.y +
            blanketPosition[1];

        food.setDepth(20);

        this.blanketFoodCount += 1;
    });

    this.countingPersonCompleted[
        selectedPerson
    ] = true;

    this.blanketCounterText.setText(
        `Pieces counted: ${this.blanketFoodCount}`
    );

    this.countingInstructionText.setText(
        `${selectedPerson}'s food is on the blanket.`
    );

    this.countingSelectedPerson = null;

    Object.entries(
        this.countingPersonSelectors
    ).forEach(([label, selector]) => {
        if (
            this.countingPersonCompleted[
                label
            ]
        )
        {
            selector.setStrokeStyle(
                3,
                0x777777,
                1
            );
        }
        else
        {
            selector.setStrokeStyle(
                0,
                0x1b6f3a,
                0
            );
        }
    });

    this.showTotalFoodCountNextButtonIfReady();
}

showTotalFoodCountNextButtonIfReady ()
{
    if (
        this.blanketFoodCount ===
            this.totalFoodToCount &&
        !this.distributionNextShown
    )
    {
        this.distributionNextShown = true;

        this.time.delayedCall(
            100,
            () => {
                this.createNextButton(
                    640,
                    675,
                    'Next',
                    () => {
                        this.showTotalFoodEstimateQuestion();
                    }
                );
            }
        );
    }
}

createDraggableFoodPieces (
    avatarX,
    avatarY,
    scale,
    foodAmount
)
{
    const getBlanketFoodPosition =
        index => {
            const positions = [
                [-150, -25],
                [-115, -25],
                [-80, -25],
                [-150, 10],
                [-115, 10],
                [-80, 10],
                [80, -25],
                [115, -25],
                [150, -25],
                [80, 10],
                [115, 10],
                [150, 10],
                [-150, 45],
                [-115, 45],
                [-80, 45],
                [80, 45],
                [115, 45],
                [150, 45]
            ];

            return positions[index];
        };

    for (
        let i = 0;
        i < foodAmount;
        i += 1
    )
    {
        const position = i;

        const startX =
            avatarX +
            (
                39 +
                ((position % 3) - 1) * 15
            ) * scale;

        const startY =
            avatarY +
            (
                25 +
                Math.floor(position / 3) * 13
            ) * scale;

        const food =
            this.add.circle(
                startX,
                startY,
                7,
                0xb22222
            );

        food.setStrokeStyle(
            1,
            0x000000
        );

        food.setInteractive(
            new Phaser.Geom.Circle(
                0,
                0,
                28
            ),
            Phaser.Geom.Circle.Contains,
            {
                useHandCursor: true
            }
        );

        food.setDepth(10);

        food.startX = startX;
        food.startY = startY;
        food.counted = false;

        this.input.setDraggable(food);

        food.on(
            'dragstart',
            () => {
                food.setDepth(20);
            }
        );

        food.on(
            'drag',
            (
                pointer,
                dragX,
                dragY
            ) => {
                food.x = dragX;
                food.y = dragY;
            }
        );

        food.on(
            'dragend',
            () => {
                const blanketBounds =
                    this.blanket.getBounds();

                if (
                    Phaser.Geom.Rectangle.Contains(
                        blanketBounds,
                        food.x,
                        food.y
                    )
                )
                {
                    if (!food.counted)
                    {
                        food.counted = true;
                        this.blanketFoodCount += 1;

                        const pilePosition =
                            this.blanketFoodCount - 1;

                        const blanketPosition =
                            getBlanketFoodPosition(
                                pilePosition
                            );

                        food.x =
                            this.blanket.x +
                            blanketPosition[0];

                        food.y =
                            this.blanket.y +
                            blanketPosition[1];

                        this.blanketCounterText.setText(
                            `Pieces counted: ${this.blanketFoodCount}`
                        );

                        if (
                            this.blanketFoodCount ===
                                this.totalFoodToCount &&
                            !this.distributionNextShown
                        )
                        {
                            this.distributionNextShown = true;

                            this.time.delayedCall(
                                100,
                                () => {
                                    this.createNextButton(
                                        640,
                                        675,
                                        'Next',
                                        () => {
                                            this.showTotalFoodEstimateQuestion();
                                        }
                                    );
                                }
                            );
                        }
                    }

                    food.setDepth(20);
                }
                else
                {
                    if (!food.counted)
                    {
                        food.x = food.startX;
                        food.y = food.startY;
                    }

                    food.setDepth(10);
                }
            }
        );

        this.addQuestionObject(food);
    }
}

showTotalFoodEstimateQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            520,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            220,
            'How many total pieces of food do you estimate the group collected today?',
            {
                fontSize: '30px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 900
                },
                lineSpacing: 8
            }
        ).setOrigin(0.5)
    );

    let answers = [
        'More than 15 pieces of food',
        'Exactly 15 pieces of food',
        'Less than 15 pieces of food'
    ];

    if (
        Phaser.Math.Between(0, 1) === 1
    )
    {
        answers = answers.reverse();
    }

    this.createAnswerButton(
        640,
        360,
        answers[0],
        'totalFoodEstimate'
    );

    this.createAnswerButton(
        640,
        460,
        answers[1],
        'totalFoodEstimate'
    );

    this.createAnswerButton(
        640,
        560,
        answers[2],
        'totalFoodEstimate'
    );
}

showEqualDivisionTask ()
{
    this.clearQuestionScreen();

    const fixedFood = this.getFixedFoodCounts();
    const totalFood = fixedFood.total;

    const roleLabels = [
        'Person A',
        'Person B',
        'Person C'
    ];

    const equalShare =
        totalFood / roleLabels.length;

    this.equalDivisionCounts = {
        'Person A': 0,
        'Person B': 0,
        'Person C': 0
    };

    this.equalDivisionAssignedCount = 0;
    this.equalDivisionCompleted = false;
    this.equalDivisionNextShown = false;
    this.equalDivisionFoods = [];

    this.equalDivisionInstructionText =
        this.add.text(
            640,
            45,
            'Click the blanket to divide the food equally among all three people.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 1000
                }
            }
        ).setOrigin(0.5);

    this.addQuestionObject(
        this.equalDivisionInstructionText
    );

    this.equalDivisionBlanket =
        this.add.rectangle(
            640,
            195,
            500,
            130,
            0xd8ecff
        );

    this.equalDivisionBlanket.setStrokeStyle(
        4,
        0x335577
    );

    this.equalDivisionBlanket.setDepth(1);

    this.equalDivisionBlanket.setInteractive({
        useHandCursor: true
    });

    this.addQuestionObject(
        this.equalDivisionBlanket
    );

    this.equalDivisionBlanketLabel =
        this.add.text(
            640,
            195,
            'Click the blanket',
            {
                fontSize: '24px',
                color: '#000000'
            }
        ).setOrigin(0.5);

    this.equalDivisionBlanketLabel.setDepth(2);

    this.addQuestionObject(
        this.equalDivisionBlanketLabel
    );

    const baselineY = 430;

    this.equalDivisionBaselineY = baselineY;

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            260,
            baselineY,
            'Person A',
            1.05,
            0xcc3333,
            0
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            baselineY,
            'Person B',
            1.00,
            0x3366cc,
            0
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            1020,
            baselineY,
            'Person C',
            0.90,
            0x339966,
            0
        )
    );

    this.createEqualDivisionFoodPieces(
        totalFood
    );

    this.equalDivisionBlanket.on(
        'pointerdown',
        () => {
            if (this.equalDivisionCompleted)
            {
                return;
            }

            const basketPositions = {
                'Person A': {
                    x: 260 + 39 * 1.05,
                    y:
                        this.equalDivisionBaselineY +
                        31 * 1.05,
                    scale: 1.05
                },

                'Person B': {
                    x: 640 + 39,
                    y:
                        this.equalDivisionBaselineY +
                        31,
                    scale: 1.00
                },

                'Person C': {
                    x: 1020 + 39 * 0.90,
                    y:
                        this.equalDivisionBaselineY +
                        31 * 0.90,
                    scale: 0.90
                }
            };

            this.equalDivisionFoods.forEach(
                (food, index) => {
                    const roleIndex =
                        Math.floor(
                            index / equalShare
                        );

                    const roleLabel =
                        roleLabels[roleIndex];

                    const pilePosition =
                        index % equalShare;

                    const basket =
                        basketPositions[roleLabel];

                    food.assignedPerson =
                        roleLabel;

                    food.x =
                        basket.x +
                        (
                            (pilePosition % 3) - 1
                        ) *
                        15 *
                        basket.scale;

                    food.y =
                        basket.y -
                        6 * basket.scale +
                        Math.floor(
                            pilePosition / 3
                        ) *
                        13 *
                        basket.scale;

                    food.setDepth(20);
                }
            );

            this.equalDivisionCounts = {
                'Person A': equalShare,
                'Person B': equalShare,
                'Person C': equalShare
            };

            this.equalDivisionAssignedCount =
                totalFood;

            this.equalDivisionCompleted = true;

            this.gameData.equalDivisionShortcutUsed =
                true;

            this.equalDivisionBlanket
                .disableInteractive();

            this.equalDivisionBlanket.setFillStyle(
                0xc7d9eb
            );

            this.equalDivisionBlanketLabel.setText(
                'Food divided equally'
            );

            this.equalDivisionInstructionText.setText(
                `The food has been divided equally. \n \n Each person now has ${equalShare} pieces.`
            );

            if (!this.equalDivisionNextShown)
            {
                this.equalDivisionNextShown = true;

                this.createNextButton(
                    640,
                    675,
                    'Next',
                    () => {
                        this.gameData
                            .equalDivisionFinal
                            .personA =
                            this.equalDivisionCounts[
                                'Person A'
                            ];

                        this.gameData
                            .equalDivisionFinal
                            .personB =
                            this.equalDivisionCounts[
                                'Person B'
                            ];

                        this.gameData
                            .equalDivisionFinal
                            .personC =
                            this.equalDivisionCounts[
                                'Person C'
                            ];

                        this.showPerCapitaQuestion();
                    }
                );
            }
        }
    );
}

createEqualDivisionFoodPieces (totalFood)
{
    const positions = [
        [-170, -25],
        [-130, -25],
        [-90, -25],

        [-170, 10],
        [-130, 10],
        [-90, 10],

        [90, -25],
        [130, -25],
        [170, -25],

        [90, 10],
        [130, 10],
        [170, 10],

        [-170, 45],
        [-130, 45],
        [-90, 45],

        [90, 45],
        [130, 45],
        [170, 45]
    ];

    this.equalDivisionFoods = [];

    for (let i = 0; i < totalFood; i++)
    {
        const position = positions[i];

        const food = this.add.circle(
            this.equalDivisionBlanket.x +
                position[0],
            this.equalDivisionBlanket.y +
                position[1],
            7,
            0xb22222
        );

        food.setStrokeStyle(
            1,
            0x000000
        );

        food.setDepth(10);
        food.assignedPerson = null;

        this.equalDivisionFoods.push(food);

        this.addQuestionObject(food);
    }
}

showPerCapitaQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            900,
            450,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            230,
            170,
            'If the three members of the group equally divide between them the total pieces of food they collected today, how many pieces will each person get?',
            {
                fontSize: '28px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 820
                }
            }
        )
    );

    this.createAnswerButton(
        640,
        365,
        'More than 5 pieces of food each',
        'perCapitaEstimate'
    );

    this.createAnswerButton(
        640,
        445,
        'Exactly 5 pieces of food each',
        'perCapitaEstimate'
    );

    this.createAnswerButton(
        640,
        525,
        'Less than 5 pieces of food each',
        'perCapitaEstimate'
    );
}

showGroupDistributionPreferenceQuestion ()
{
    this.clearQuestionScreen();

    const fixedFood =
        this.getFixedFoodCounts();

    const personADisplayFood =
        fixedFood.personA;

    const personBDisplayFood =
        fixedFood.personB;

    const personCDisplayFood =
        fixedFood.personC;

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            260,
            115,
            'Person A',
            0.78,
            0xcc3333,
            personADisplayFood
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            115,
            'Person B',
            0.72,
            0x3366cc,
            personBDisplayFood
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            980,
            115,
            'Person C',
            0.66,
            0x339966,
            personCDisplayFood
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            440,
            1180,
            390,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            320,
            'In this scenario, should the group divide the food equally among all members, or should each member of the group keep the food they collected?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group should divide the food equally among all members.',
            'Each member of the group should keep the food they collected.'
        ]);

    this.createAnswerButton(
        640,
        470,
        answers[0],
        'groupDistributionPreference'
    );

    this.createAnswerButton(
        640,
        575,
        answers[1],
        'groupDistributionPreference'
    );
}

createStaticHumanAvatar (
    x,
    y,
    label,
    scale,
    shirtColor,
    foodAmount = 0,
    showBasket = true
)
{
    const person =
        this.add.container(x, y);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const pantsColor = 0x333333;

    person.foodCount = 0;

    person.add(
        this.add.rectangle(
            0,
            -18 * scale,
            10 * scale,
            14 * scale,
            skinColor
        )
    );

    person.add(
        this.add.circle(
            0,
            -43 * scale,
            24 * scale,
            skinColor
        )
    );

    person.add(
        this.add.ellipse(
            0,
            -64 * scale,
            46 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            -17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.circle(
            -8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.circle(
            8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            0,
            -35 * scale,
            3 * scale,
            9 * scale,
            0x9b5c2e
        )
    );

    person.add(
        this.add.rectangle(
            0,
            -27 * scale,
            12 * scale,
            2 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            0,
            8 * scale,
            46 * scale,
            64 * scale,
            shirtColor
        )
    );

    person.add(
        this.add.rectangle(
            -32 * scale,
            10 * scale,
            10 * scale,
            52 * scale,
            skinColor
        )
    );

    person.add(
        this.add.rectangle(
            32 * scale,
            10 * scale,
            10 * scale,
            52 * scale,
            skinColor
        )
    );

    if (showBasket)
    {
        person.add(
            this.createBasket(
                39 * scale,
                31 * scale,
                scale
            )
        );

        for (
            let i = 0;
            i < foodAmount;
            i += 1
        )
        {
            person.foodCount += 1;

            const position =
                person.foodCount - 1;

            const appleX =
                (
                    39 +
                    (
                        (position % 3) -
                        1
                    ) *
                    15
                ) *
                scale;

            const appleY =
                (
                    25 +
                    Math.floor(
                        position / 3
                    ) *
                    13
                ) *
                scale;

            person.add(
                this.add.circle(
                    appleX,
                    appleY,
                    5.5 * scale,
                    0xb22222
                )
            );
        }
    }

    person.add(
        this.add.rectangle(
            -12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.rectangle(
            12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.text(
            0,
            135 * scale,
            label,
            {
                fontSize: '26px',
                color: '#000000'
            }
        ).setOrigin(0.5)
    );

    return person;
}

showPartialRedistributionTask ()
{
    this.clearQuestionScreen();

    const fixedFood =
        this.getFixedFoodCounts();

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
            color: 0xcc3333,
            foodAmount: fixedFood.personA
        },
        {
            label: 'Person B',
            x: 640,
            scale: 1.00,
            color: 0x3366cc,
            foodAmount: fixedFood.personB
        },
        {
            label: 'Person C',
            x: 1020,
            scale: 0.90,
            color: 0x339966,
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

    this.partialRedistributionInstructionText =
        this.add.text(
            640,
            65,
            'Redistribute food above the 5-piece survival threshold so that the greatest possible number of people have enough food to survive.',
            {
                fontSize: '26px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 1050
                }
            }
        ).setOrigin(0.5);

    this.addQuestionObject(
        this.partialRedistributionInstructionText
    );

    const baselineY = 390;

    this.partialRedistributionBaselineY =
        baselineY;

    const basketPositions = {
        'Person A': {
            x: 260 + 39 * 1.05,
            y:
                baselineY +
                31 * 1.05,
            scale: 1.05
        },

        'Person B': {
            x: 640 + 39,
            y:
                baselineY +
                31,
            scale: 1.00
        },

        'Person C': {
            x: 1020 + 39 * 0.90,
            y:
                baselineY +
                31 * 0.90,
            scale: 0.90
        }
    };

    const placeFood = (
        food,
        personLabel,
        pilePosition
    ) => {
        const basket =
            basketPositions[personLabel];

        food.x =
            basket.x +
            (
                (pilePosition % 3) - 1
            ) *
            15 *
            basket.scale;

        food.y =
            basket.y -
            6 * basket.scale +
            Math.floor(
                pilePosition / 3
            ) *
            13 *
            basket.scale;

        food.setDepth(20);
    };

    people.forEach(person => {
        this.addQuestionObject(
            this.createStaticHumanAvatar(
                person.x,
                baselineY,
                person.label,
                person.scale,
                person.color,
                0
            )
        );

        for (
            let i = 0;
            i < person.foodAmount;
            i += 1
        )
        {
            const food = this.add.circle(
                0,
                0,
                7,
                0xb22222
            );

            food.setStrokeStyle(
                1,
                0x000000
            );

            food.assignedPerson =
                person.label;

            placeFood(
                food,
                person.label,
                i
            );

            this.partialRedistributionFoods.push(
                food
            );

            this.partialRedistributionFoodsByPerson[
                person.label
            ].push(food);

            this.addQuestionObject(food);
        }
    });

    const redistributionButton =
    this.add.rectangle(
        640,
        675,
        560,
        64,
        0x000000
    );

redistributionButton.setStrokeStyle(
    3,
    0x000000
);

redistributionButton.setInteractive({
    useHandCursor: true
});

redistributionButton.setDepth(1000);

const redistributionButtonText =
    this.add.text(
        640,
        675,
        'Redistribute to meet survival needs',
        {
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        }
    ).setOrigin(0.5);

redistributionButtonText.setDepth(1001);

    this.addQuestionObject(
        redistributionButton
    );

    this.addQuestionObject(
        redistributionButtonText
    );

    redistributionButton.on(
        'pointerdown',
        () => {
            if (
                this.partialRedistributionCompleted
            )
            {
                return;
            }

            const targetAllocation =
                this.buildSurplusOnlyPartialAllocation();

            const transferableFood = [];

            roleLabels.forEach(
                (personLabel, index) => {
                    const personFood =
                        this.partialRedistributionFoodsByPerson[
                            personLabel
                        ];

                    while (
                        personFood.length >
                        targetAllocation[index]
                    )
                    {
                        transferableFood.push(
                            personFood.pop()
                        );
                    }
                }
            );

            roleLabels.forEach(
                (personLabel, index) => {
                    const personFood =
                        this.partialRedistributionFoodsByPerson[
                            personLabel
                        ];

                    while (
                        personFood.length <
                        targetAllocation[index]
                    )
                    {
                        const transferredFood =
                            transferableFood.shift();

                        transferredFood.assignedPerson =
                            personLabel;

                        personFood.push(
                            transferredFood
                        );
                    }
                }
            );

            roleLabels.forEach(
                personLabel => {
                    this.partialRedistributionFoodsByPerson[
                        personLabel
                    ].forEach(
                        (food, pilePosition) => {
                            food.assignedPerson =
                                personLabel;

                            placeFood(
                                food,
                                personLabel,
                                pilePosition
                            );
                        }
                    );
                }
            );

            this.partialRedistributionCounts = {
                'Person A': targetAllocation[0],
                'Person B': targetAllocation[1],
                'Person C': targetAllocation[2]
            };

            this.partialRedistributionCompleted =
                true;

            this.gameData
                .partialRedistributionShortcutUsed =
                true;

            redistributionButton
                .disableInteractive();

            redistributionButton.setVisible(
                false
            );

            redistributionButtonText.setVisible(
                false
            );

            this.partialRedistributionInstructionText.setText(
                'Food above the survival threshold has been redistributed. \n \n The greatest possible number of people now have at least 5 pieces.'
            );

            if (
                !this.partialRedistributionNextShown
            )
            {
                this.partialRedistributionNextShown =
                    true;

                this.createNextButton(
                    640,
                    675,
                    'Next',
                    () => {
                        this.gameData
                            .partialRedistributionFinal
                            .personA =
                            this.partialRedistributionCounts[
                                'Person A'
                            ];

                        this.gameData
                            .partialRedistributionFinal
                            .personB =
                            this.partialRedistributionCounts[
                                'Person B'
                            ];

                        this.gameData
                            .partialRedistributionFinal
                            .personC =
                            this.partialRedistributionCounts[
                                'Person C'
                            ];

                        this.gameData
                            .partialRedistributionSurvivors =
                            Object.values(
                                this.partialRedistributionCounts
                            ).filter(
                                count => count >= 5
                            ).length;

                        this.showPartialRedistributionPreferenceQuestion();
                    }
                );
            }
        }
    );
}

showPartialRedistributionPreferenceQuestion ()
{
    this.clearQuestionScreen();

    const fixedFood =
        this.getFixedFoodCounts();

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            260,
            125,
            'Person A',
            0.78,
            0xcc3333,
            fixedFood.personA
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            125,
            'Person B',
            0.72,
            0x3366cc,
            fixedFood.personB
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            980,
            125,
            'Person C',
            0.66,
            0x339966,
            fixedFood.personC
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            460,
            1080,
            340,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            295,
            'In this scenario, should the group redistribute the food to allow the greatest possible number of people to receive at least 5 pieces, or should each person keep the food they collected?',
            {
                fontSize: '25px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 8
            }
        ).setOrigin(0.5, 0)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
            'Each person should keep the food they collected.'
        ]);

    this.createAnswerButton(
        640,
        480,
        answers[0],
        'partialRedistributionPreference'
    );

    this.createAnswerButton(
        640,
        570,
        answers[1],
        'partialRedistributionPreference'
    );
}

showPersonalRedistributionQuestion ()
{
    this.clearQuestionScreen();

    this.gameData.personalRedistributionSelected = {
        noRedistribution: false,
        equalRedistribution: false,
        partialRedistribution: false
    };

    this.personalRedistributionNextShown = false;

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            520,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            150,
            'Which of the following approaches do you believe are appropriate in this scenario? Select all that apply.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const options =
        Phaser.Utils.Array.Shuffle([
            {
                label:
                    'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label:
                    'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label:
                    'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
                key: 'partialRedistribution'
            }
        ]);

    options.forEach((option, index) => {
        this.createPersonalRedistributionCheckboxButton(
            640,
            290 + index * 105,
            option.label,
            option.key
        );
    });
}

createPersonalRedistributionCheckboxButton (
    centerX,
    centerY,
    label,
    key
)
{
    const box = this.add.rectangle(
        centerX - 420,
        centerY,
        34,
        34,
        0xffffff
    );

    box.setStrokeStyle(3, 0x000000);

    box.setInteractive({
        useHandCursor: true
    });

    const check = this.add.text(
        centerX - 420,
        centerY,
        '✓',
        {
            fontSize: '30px',
            color: '#000000'
        }
    ).setOrigin(0.5);

    check.setVisible(false);

    const text = this.add.text(
        centerX - 375,
        centerY,
        label,
        {
            fontSize: '23px',
            color: '#000000',
            wordWrap: {
                width: 780
            }
        }
    ).setOrigin(0, 0.5);

    text.setInteractive({
        useHandCursor: true
    });

    const toggle = () => {
        this.gameData.personalRedistributionSelected[
            key
        ] =
            !this.gameData.personalRedistributionSelected[
                key
            ];

        check.setVisible(
            this.gameData.personalRedistributionSelected[
                key
            ]
        );

        const anySelected =
            this.gameData.personalRedistributionSelected
                .noRedistribution ||
            this.gameData.personalRedistributionSelected
                .equalRedistribution ||
            this.gameData.personalRedistributionSelected
                .partialRedistribution;

        if (anySelected)
        {
            if (
                !this.personalRedistributionNextShown
            )
            {
                this.personalRedistributionNextShown =
                    true;

                this.createNextButton(
                    640,
                    675,
                    'Next',
                    () => {
                        this.showPersonalVsGroupResponsibilityQuestion();
                    }
                );
            }
        }
        else
        {
            if (this.currentNextButton)
            {
                this.currentNextButton.destroy();
                this.currentNextButton = null;
            }

            if (this.currentNextText)
            {
                this.currentNextText.destroy();
                this.currentNextText = null;
            }

            this.personalRedistributionNextShown =
                false;
        }
    };

    box.on('pointerdown', toggle);
    text.on('pointerdown', toggle);

    this.addQuestionObject(box);
    this.addQuestionObject(check);
    this.addQuestionObject(text);
}

showSurvivalRedistributionQuestion ()
{
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
    this.gameData.redistributionRulesSelected =
        this.gameData.survivalRedistributionSelected;

    this.survivalRedistributionNextShown = false;

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            520,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            160,
            'Which of the following approaches would help make sure the greatest number of people survive? Select all that apply.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const options =
        Phaser.Utils.Array.Shuffle([
            {
                label:
                    'Each member of the group should keep the food they collected.',
                key: 'noRedistribution'
            },
            {
                label:
                    'The group should divide the food equally among all members.',
                key: 'equalRedistribution'
            },
            {
                label:
                    'The group should redistribute the food so that the greatest possible number of people receive at least 5 pieces.',
                key: 'partialRedistribution'
            }
        ]);

    options.forEach((option, index) => {
        this.createCheckboxButton(
            640,
            300 + index * 100,
            option.label,
            option.key
        );
    });
}

createCheckboxButton (
    centerX,
    centerY,
    label,
    key
)
{
    const box = this.add.rectangle(
        centerX - 420,
        centerY,
        34,
        34,
        0xffffff
    );

    box.setStrokeStyle(3, 0x000000);

    box.setInteractive({
        useHandCursor: true
    });

    const check = this.add.text(
        centerX - 420,
        centerY,
        '✓',
        {
            fontSize: '30px',
            color: '#000000'
        }
    ).setOrigin(0.5);

    check.setVisible(false);

    const text = this.add.text(
        centerX - 375,
        centerY,
        label,
        {
            fontSize: '23px',
            color: '#000000',
            wordWrap: {
                width: 780
            }
        }
    ).setOrigin(0, 0.5);

    text.setInteractive({
        useHandCursor: true
    });

    const toggle = () => {
        this.gameData.survivalRedistributionSelected[
            key
        ] =
            !this.gameData.survivalRedistributionSelected[
                key
            ];

        this.gameData.redistributionRulesSelected =
            this.gameData.survivalRedistributionSelected;

        check.setVisible(
            this.gameData.survivalRedistributionSelected[
                key
            ]
        );

        const anySelected =
            this.gameData.survivalRedistributionSelected
                .noRedistribution ||
            this.gameData.survivalRedistributionSelected
                .equalRedistribution ||
            this.gameData.survivalRedistributionSelected
                .partialRedistribution;

        if (anySelected)
        {
            if (
                !this.survivalRedistributionNextShown
            )
            {
                this.survivalRedistributionNextShown =
                    true;

                this.createNextButton(
                    640,
                    675,
                    'Next',
                    () => {
                        this.showPersonalRedistributionQuestion();
                    }
                );
            }
        }
        else
        {
            if (this.currentNextButton)
            {
                this.currentNextButton.destroy();
                this.currentNextButton = null;
            }

            if (this.currentNextText)
            {
                this.currentNextText.destroy();
                this.currentNextText = null;
            }

            this.survivalRedistributionNextShown =
                false;
        }
    };

    box.on('pointerdown', toggle);
    text.on('pointerdown', toggle);

    this.addQuestionObject(box);
    this.addQuestionObject(check);
    this.addQuestionObject(text);
}

showDistributivePrincipleQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            500,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            230,
            'When deciding how to distribute food, which principle should be the highest priority?',
            {
                fontSize: '29px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'Making sure the person who collects the most food has enough food to survive.',
            'Making sure the person who collects the least food has enough food to survive.'
        ]);

    this.createAnswerButton(
        640,
        410,
        answers[0],
        'distributivePrinciplePriority'
    );

    this.createAnswerButton(
        640,
        535,
        answers[1],
        'distributivePrinciplePriority'
    );
}

showSocialContractQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            500,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            235,
            'In this scenario, should the group form a social contract that guarantees every member has enough food to survive, or should the group not form such a social contract?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group should form a social contract that guarantees every member has enough food to survive.',
            'The group should not form a social contract that guarantees every member has enough food to survive.'
        ]);

    this.createAnswerButton(
        640,
        410,
        answers[0],
        'socialContractGuarantee'
    );

    this.createAnswerButton(
        640,
        535,
        answers[1],
        'socialContractGuarantee'
    );
}

showPersonalVsGroupResponsibilityQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            500,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            230,
            'For the most people to survive today and in the future, is it more important that each member of the group takes personal responsibility for ensuring he collects enough food for himself to survive or takes responsibility for ensuring all members of the group have enough food to survive?',
            {
                fontSize: '25px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'It is more important each member of the group takes responsibility for ensuring all members of the group have enough food to survive.',
            'It is more important each member of the group takes personal responsibility for ensuring he collects enough food for himself to survive.'
        ]);

    this.createAnswerButton(
        640,
        430,
        answers[0],
        'personalVsGroupResponsibility'
    );

    this.createAnswerButton(
        640,
        550,
        answers[1],
        'personalVsGroupResponsibility'
    );
}

showFairRuleQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            500,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            230,
            'Which rule is more fair for this group of people?',
            {
                fontSize: '29px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'A fair rule would be that all three people must always share their food equitably whenever they hunt and gather more than 5 pieces in a day.',
            'A fair rule would be that the amount of food each person eats should be proportional to the amount he collects by himself.'
        ]);

    this.createAnswerButton(
        640,
        410,
        answers[0],
        'fairRuleChoice'
    );

    this.createAnswerButton(
        640,
        540,
        answers[1],
        'fairRuleChoice'
    );
}

showFoodRankReminderScreen ()
{
    this.clearQuestionScreen();

    this.gameData.foodRankReminder =
        'shown';

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1080,
            520,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    const fixedFood =
        this.getFixedFoodCounts();

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            280,
            185,
            'Person A',
            1.12,
            0xcc3333,
            fixedFood.personA
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            185,
            'Person B',
            1.00,
            0x3366cc,
            fixedFood.personB
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            1000,
            185,
            'Person C',
            0.88,
            0x339966,
            fixedFood.personC
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            450,
            'Remember, Person A always collects the most pieces of food per day. Person B always collects the median pieces of food per day. Person C always collects the least pieces of food per day.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 940
                },
                lineSpacing: 8
            }
        ).setOrigin(0.5)
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.showFoodPriorityQuestion();
        }
    );
}
showFoodPriorityQuestion ()
{
    this.clearQuestionScreen();

    const fixedFood =
        this.getFixedFoodCounts();

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            280,
            90,
            'Person A',
            0.82,
            0xcc3333,
            fixedFood.personA
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            90,
            'Person B',
            0.74,
            0x3366cc,
            fixedFood.personB
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            1000,
            90,
            'Person C',
            0.66,
            0x339966,
            fixedFood.personC
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            435,
            1120,
            390,
            0xffffff
        )
    ).setStrokeStyle(
        4,
        0x000000
    );

    this.addQuestionObject(
        this.add.text(
            640,
            285,
            'Whose food requirements should the group prioritize in order to maximize the number of people who stay alive?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group should make sure Person C gets at least 5 pieces of the food collected every day because the other people have more food and because without enough food Person C will die.',
            'The group should make sure Person A gets at least 5 pieces of the food collected every day because Person A usually is able to share the most food and because Person A is most likely to survive in the long run.'
        ]);

    this.createAnswerButton(
        640,
        400,
        answers[0],
        'foodPriorityChoice'
    );

    this.createAnswerButton(
        640,
        535,
        answers[1],
        'foodPriorityChoice'
    );
}

showHardWorkReminderScreen ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1080,
            520,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.createTiredHumanAvatar(
            280,
            240,
            'Person A',
            1.12,
            0xcc3333
        )
    );

    this.addQuestionObject(
        this.createTiredHumanAvatar(
            640,
            240,
            'Person B',
            1.00,
            0x3366cc
        )
    );

    this.addQuestionObject(
        this.createTiredHumanAvatar(
            1000,
            240,
            'Person C',
            0.88,
            0x339966
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            480,
            'Hunting and gathering food is hard work.',
            {
                fontSize: '30px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 940
                },
                lineSpacing: 8
            }
        ).setOrigin(0.5)
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.showWorkBreakQuestion();
        }
    );
}

showWorkBreakQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.createTiredFace(
            640,
            145,
            1.6
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            465,
            1120,
            360,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            340,
            'One day, one of the people is exhausted and wants to take a break from hunting and gathering food. Should the person keep working or take a break?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The person should take a break.',
            'The person should keep hunting and gathering food.'
        ]);

    this.createAnswerButton(
        640,
        475,
        answers[0],
        'workBreakChoice'
    );

    this.createAnswerButton(
        640,
        570,
        answers[1],
        'workBreakChoice'
    );
}

createTiredHumanAvatar (
    x,
    y,
    label,
    scale,
    shirtColor
)
{
    const person =
        this.add.container(x, y);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const pantsColor = 0x333333;
    const sweatColor = 0x4aa3df;

    person.add(
        this.add.rectangle(
            0,
            -18 * scale,
            10 * scale,
            14 * scale,
            skinColor
        )
    );

    person.add(
        this.add.circle(
            0,
            -43 * scale,
            24 * scale,
            skinColor
        )
    );

    person.add(
        this.add.ellipse(
            0,
            -64 * scale,
            46 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            -17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.rectangle(
            -8 * scale,
            -43 * scale,
            12 * scale,
            2 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            8 * scale,
            -43 * scale,
            12 * scale,
            2 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            0,
            -35 * scale,
            3 * scale,
            9 * scale,
            0x9b5c2e
        )
    );

    person.add(
        this.add.arc(
            0,
            -24 * scale,
            9 * scale,
            200,
            340,
            false,
            0x000000
        )
    );

    person.add(
        this.add.circle(
            -9 * scale,
            -50 * scale,
            3.2 * scale,
            sweatColor
        )
    );

    person.add(
        this.add.circle(
            7 * scale,
            -59 * scale,
            3 * scale,
            sweatColor
        )
    );

    person.add(
        this.add.circle(
            -22 * scale,
            -38 * scale,
            3.5 * scale,
            sweatColor
        )
    );

    person.add(
        this.add.circle(
            18 * scale,
            -45 * scale,
            2.8 * scale,
            sweatColor
        )
    );

    person.add(
        this.add.rectangle(
            0,
            8 * scale,
            46 * scale,
            64 * scale,
            shirtColor
        )
    );

    person.add(
        this.add.rectangle(
            -34 * scale,
            15 * scale,
            10 * scale,
            52 * scale,
            skinColor
        ).setAngle(18)
    );

    person.add(
        this.add.rectangle(
            34 * scale,
            15 * scale,
            10 * scale,
            52 * scale,
            skinColor
        ).setAngle(-18)
    );

    person.add(
        this.add.rectangle(
            -12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.rectangle(
            12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.text(
            0,
            135 * scale,
            label,
            {
                fontSize: '26px',
                color: '#000000'
            }
        ).setOrigin(0.5)
    );

    return person;
}

createTiredFace (x, y, scale)
{
    const face =
        this.add.container(x, y);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const sweatColor = 0x4aa3df;

    face.add(
        this.add.circle(
            0,
            0,
            48 * scale,
            skinColor
        )
    );

    face.add(
        this.add.ellipse(
            0,
            -45 * scale,
            90 * scale,
            30 * scale,
            hairColor
        )
    );

    face.add(
        this.add.ellipse(
            -34 * scale,
            -28 * scale,
            22 * scale,
            38 * scale,
            hairColor
        )
    );

    face.add(
        this.add.ellipse(
            34 * scale,
            -28 * scale,
            22 * scale,
            38 * scale,
            hairColor
        )
    );

    face.add(
        this.add.rectangle(
            -18 * scale,
            -5 * scale,
            20 * scale,
            3 * scale,
            0x000000
        )
    );

    face.add(
        this.add.rectangle(
            18 * scale,
            -5 * scale,
            20 * scale,
            3 * scale,
            0x000000
        )
    );

    face.add(
        this.add.rectangle(
            0,
            10 * scale,
            5 * scale,
            16 * scale,
            0x9b5c2e
        )
    );

    face.add(
        this.add.arc(
            0,
            35 * scale,
            18 * scale,
            200,
            340,
            false,
            0x000000
        )
    );

    face.add(
        this.add.circle(
            -15 * scale,
            -30 * scale,
            6 * scale,
            sweatColor
        )
    );

    face.add(
        this.add.circle(
            -40 * scale,
            -6 * scale,
            6 * scale,
            sweatColor
        )
    );

    face.add(
        this.add.circle(
            -46 * scale,
            10 * scale,
            4.5 * scale,
            sweatColor
        )
    );

    face.add(
        this.add.circle(
            40 * scale,
            -9 * scale,
            6 * scale,
            sweatColor
        )
    );

    face.add(
        this.add.circle(
            46 * scale,
            20 * scale,
            4.5 * scale,
            sweatColor
        )
    );

    return face;
}

showFloodRiskInstructionScreen ()
{
    this.clearQuestionScreen();

    const sticksOnLeft =
        Phaser.Math.Between(0, 1) === 0;

    this.floodTaskSides = {
        sticksX:
            sticksOnLeft ? 230 : 1050,
        treeX:
            sticksOnLeft ? 1050 : 230
    };

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            560,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.drawStormCloud(
        1035,
        120,
        0.55
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            470,
            345,
            '',
            0.95,
            0xcc3333,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            345,
            '',
            0.88,
            0x3366cc,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            810,
            345,
            '',
            0.80,
            0x339966,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            575,
            'It is highly likely the location will flood when the rainy season arrives in a few weeks.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.showFloodPreparationQuestion();
        }
    );
}

drawStormCloud (x, y, scale = 1)
{
    const cloudColor = 0x6f7780;
    const darkCloudColor = 0x505860;
    const rainColor = 0x3f7fbf;

    this.addQuestionObject(
        this.add.circle(
            x - 55 * scale,
            y + 5 * scale,
            34 * scale,
            cloudColor
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x - 20 * scale,
            y - 15 * scale,
            45 * scale,
            cloudColor
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x + 30 * scale,
            y - 10 * scale,
            40 * scale,
            darkCloudColor
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x + 70 * scale,
            y + 8 * scale,
            30 * scale,
            cloudColor
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            x + 8 * scale,
            y + 18 * scale,
            150 * scale,
            42 * scale,
            cloudColor
        )
    );

    for (let i = 0; i < 6; i += 1)
    {
        const rain = this.add.line(
            x - 65 * scale +
                i * 26 * scale,
            y + 65 * scale,
            0,
            0,
            -8 * scale,
            28 * scale,
            rainColor
        );

        rain.setLineWidth(
            3 * scale
        );

        this.addQuestionObject(rain);
    }
}

drawStickPile (x, y)
{
    const stickColor = 0x8b5a2b;

    for (let i = 0; i < 8; i += 1)
    {
        const stick =
            this.add.rectangle(
                x +
                    Phaser.Math.Between(
                        -35,
                        35
                    ),
                y +
                    Phaser.Math.Between(
                        -20,
                        20
                    ),
                95,
                9,
                stickColor
            );

        stick.setAngle(
            Phaser.Math.Between(
                -35,
                35
            )
        );

        stick.setStrokeStyle(
            1,
            0x4a2a12
        );

        this.addQuestionObject(stick);
    }
}

drawFloodTaskTree (x, y)
{
    this.addQuestionObject(
        this.add.rectangle(
            x,
            y + 75,
            36,
            130,
            0x9b6329
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x,
            y - 40,
            78,
            0x2f7d32
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x - 55,
            y,
            58,
            0x3d9a42
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x + 55,
            y,
            58,
            0x3d9a42
        )
    );

    this.addQuestionObject(
        this.add.circle(
            x,
            y + 35,
            64,
            0x2f8f38
        )
    );

    const fruitPositions = [
        [-42, -62],
        [-12, -78],
        [18, -70],
        [46, -48],
        [-68, -18],
        [-35, -10],
        [-2, -22],
        [32, -8],
        [62, 6],
        [-52, 28],
        [-18, 36],
        [16, 32],
        [48, 42]
    ];

    fruitPositions.forEach(position => {
        const fruit = this.add.circle(
            x + position[0],
            y + position[1],
            6,
            0xb22222
        );

        fruit.setStrokeStyle(
            1,
            0x000000
        );

        this.addQuestionObject(fruit);
    });
}

showFloodPreparationQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            560,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.drawFloodTaskTree(
        this.floodTaskSides.treeX,
        165
    );

    this.drawStickPile(
        this.floodTaskSides.sticksX,
        275
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            470,
            275,
            '',
            0.82,
            0xcc3333,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            275,
            '',
            0.76,
            0x3366cc,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            810,
            275,
            '',
            0.70,
            0x339966,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            400,
            'Should the group spend the rest of the day looking for more food to eat or preparing the location to withstand flooding in a few weeks?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group should spend the rest of the day looking for more food to eat.',
            'The group should spend the rest of the day preparing the location to withstand flooding in two weeks.'
        ]);

    this.createAnswerButton(
        640,
        500,
        answers[0],
        'floodPreparationChoice'
    );

    this.createAnswerButton(
        640,
        580,
        answers[1],
        'floodPreparationChoice'
    );
}

showPersonDInstructionScreen ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            560,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            165,
            'A new person (Person D) wanders into the group’s location and begs for food. The new person is peaceful and not threatening.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            240,
            375,
            'Person A',
            0.78,
            0xcc3333,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            395,
            355,
            'Person B',
            0.72,
            0x3366cc,
            0,
            false
        )
    );

    this.drawSmallFire(
        395,
        525,
        0.75
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            535,
            390,
            'Person C',
            0.66,
            0x339966,
            0,
            false
        )
    );

    this.addQuestionObject(
        this.createPersonDOutstretchedAvatar(
            1050,
            355,
            'Person D',
            0.66,
            0x8a5a44
        )
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.showPersonDShareQuestion();
        }
    );
}

showPersonDShareQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.createPersonDOutstretchedAvatar(
            640,
            125,
            'Person D',
            0.82,
            0x8a5a44
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            425,
            1120,
            300,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            325,
            'Should the members of the group share their food with Person D or ask Person D to get food elsewhere?',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'Members of the group should share their food with Person D.',
            'Members of the group should ask Person D to get food elsewhere.'
        ]);

    this.createAnswerButton(
        640,
        435,
        answers[0],
        'personDShareChoice'
    );

    this.createAnswerButton(
        640,
        525,
        answers[1],
        'personDShareChoice'
    );
}

createPersonDOutstretchedAvatar (
    x,
    y,
    label,
    scale,
    shirtColor
)
{
    const person =
        this.add.container(x, y);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const pantsColor = 0x333333;

    person.add(
        this.add.rectangle(
            0,
            -18 * scale,
            10 * scale,
            14 * scale,
            skinColor
        )
    );

    person.add(
        this.add.circle(
            0,
            -43 * scale,
            24 * scale,
            skinColor
        )
    );

    person.add(
        this.add.ellipse(
            0,
            -64 * scale,
            46 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            -17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.circle(
            -14 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.circle(
            -2 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            -6 * scale,
            -35 * scale,
            3 * scale,
            9 * scale,
            0x9b5c2e
        )
    );

    person.add(
        this.add.arc(
            -6 * scale,
            -25 * scale,
            9 * scale,
            20,
            160,
            false,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            0,
            8 * scale,
            42 * scale,
            60 * scale,
            shirtColor
        )
    );

    person.add(
        this.add.rectangle(
            -42 * scale,
            -2 * scale,
            58 * scale,
            9 * scale,
            skinColor
        ).setAngle(8)
    );

    person.add(
        this.add.rectangle(
            30 * scale,
            13 * scale,
            9 * scale,
            48 * scale,
            skinColor
        ).setAngle(-12)
    );

    person.add(
        this.add.rectangle(
            -12 * scale,
            71 * scale,
            13 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.rectangle(
            12 * scale,
            71 * scale,
            13 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.text(
            0,
            130 * scale,
            label,
            {
                fontSize: '24px',
                color: '#000000'
            }
        ).setOrigin(0.5)
    );

    return person;
}

drawSmallFire (x, y, scale = 1)
{
    this.addQuestionObject(
        this.add.rectangle(
            x,
            y + 35 * scale,
            120 * scale,
            16 * scale,
            0x8b5a2b
        )
    ).setAngle(8);

    this.addQuestionObject(
        this.add.rectangle(
            x,
            y + 35 * scale,
            120 * scale,
            16 * scale,
            0x8b5a2b
        )
    ).setAngle(-8);

    this.addQuestionObject(
        this.add.triangle(
            x,
            y,
            0,
            55 * scale,
            28 * scale,
            -28 * scale,
            56 * scale,
            55 * scale,
            0xff7a00
        )
    );

    this.addQuestionObject(
        this.add.triangle(
            x,
            y + 8 * scale,
            0,
            38 * scale,
            19 * scale,
            -20 * scale,
            38 * scale,
            38 * scale,
            0xffd24a
        )
    );
}

showPersonDEmpathyQuestion ()
{
    this.clearQuestionScreen();

    this.addQuestionObject(
        this.createPersonDOutstretchedAvatar(
            640,
            125,
            'Person D',
            0.82,
            0x8a5a44
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            450,
            1120,
            350,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            325,
            'Does the group maximize the number of people who are likely to survive if they feel great empathy for Person D or if they limit their feelings of empathy for Person D?',
            {
                fontSize: '26px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The group maximizes the number of people who are likely to survive if they experience feelings of great empathy for Person D.',
            'The group maximizes the number of people who are likely to survive if they experience minimal feelings of empathy for Person D.'
        ]);

    this.createAnswerButton(
        640,
        445,
        answers[0],
        'personDEmpathyChoice'
    );

    this.createAnswerButton(
        640,
        540,
        answers[1],
        'personDEmpathyChoice'
    );
}

showCooperationCompetitionInstructionScreen ()
{
    this.clearQuestionScreen();

    const cooperativeOnLeft =
        Phaser.Math.Between(0, 1) === 0;

    const leftX = 345;
    const rightX = 935;
    const panelY = 370;

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            560,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            120,
            'Most people cooperate with others sometimes and compete with others sometimes.',
            {
                fontSize: '27px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 900
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    this.drawCooperationCompetitionPanel(
        cooperativeOnLeft
            ? leftX
            : rightX,
        panelY,
        true
    );

    this.drawCooperationCompetitionPanel(
        cooperativeOnLeft
            ? rightX
            : leftX,
        panelY,
        false
    );

    this.createNextButton(
        640,
        675,
        'Next',
        () => {
            this.showCooperationCompetitionQuestion();
        }
    );
}

drawCooperationCompetitionPanel (
    x,
    y,
    cooperative
)
{
    const panel = this.add.rectangle(
        x,
        y,
        500,
        330,
        0xf8f8f8
    );

    panel.setStrokeStyle(
        3,
        0x000000
    );

    panel.setDepth(1);

    this.addQuestionObject(panel);

    if (cooperative)
    {
        this.addQuestionObject(
            this.createPanelAvatar(
                x - 85,
                y + 45,
                '',
                0.72,
                0xcc3333,
                'smile',
                'right'
            )
        );

        this.addQuestionObject(
            this.createPanelAvatar(
                x + 10,
                y + 45,
                '',
                0.72,
                0x339966,
                'smile',
                'left'
            )
        );

        this.addQuestionObject(
            this.createPanelAvatar(
                x + 135,
                y + 45,
                '',
                0.72,
                0x3366cc,
                'smile',
                'down'
            )
        );

        const handshake =
            this.add.circle(
                x - 35,
                y + 42,
                5,
                0xb57a4f
            );

        handshake.setDepth(20);

        this.addQuestionObject(
            handshake
        );
    }
    else
    {
        this.addQuestionObject(
            this.createPanelAvatar(
                x - 145,
                y + 45,
                '',
                0.72,
                0x3366cc,
                'scowl',
                'down'
            )
        );

        this.addQuestionObject(
            this.createPanelAvatar(
                x - 35,
                y + 45,
                '',
                0.72,
                0xcc3333,
                'scowl',
                'right'
            )
        );

        this.addQuestionObject(
            this.createPanelAvatar(
                x + 55,
                y + 45,
                '',
                0.72,
                0x339966,
                'scowl',
                'left'
            )
        );

        const food = this.add.circle(
            x + 10,
            y + 42,
            5.5,
            0xb22222
        );

        food.setStrokeStyle(
            1,
            0x000000
        );

        food.setDepth(20);

        this.addQuestionObject(food);
    }
}

createPanelAvatar (
    x,
    y,
    label,
    scale,
    shirtColor,
    expression,
    armPose
)
{
    const person =
        this.add.container(x, y);

    person.setDepth(10);

    const skinColor = 0xb57a4f;
    const hairColor = 0x6b3f1d;
    const pantsColor = 0x333333;

    person.add(
        this.add.rectangle(
            0,
            -18 * scale,
            10 * scale,
            14 * scale,
            skinColor
        )
    );

    person.add(
        this.add.circle(
            0,
            -43 * scale,
            24 * scale,
            skinColor
        )
    );

    person.add(
        this.add.ellipse(
            0,
            -64 * scale,
            46 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            -17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.ellipse(
            17 * scale,
            -55 * scale,
            12 * scale,
            18 * scale,
            hairColor
        )
    );

    person.add(
        this.add.circle(
            -8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.circle(
            8 * scale,
            -43 * scale,
            2.7 * scale,
            0x000000
        )
    );

    person.add(
        this.add.rectangle(
            0,
            -35 * scale,
            3 * scale,
            9 * scale,
            0x9b5c2e
        )
    );

    if (expression === 'scowl')
    {
        person.add(
            this.add.rectangle(
                -8 * scale,
                -53 * scale,
                13 * scale,
                2 * scale,
                0x000000
            ).setAngle(18)
        );

        person.add(
            this.add.rectangle(
                8 * scale,
                -53 * scale,
                13 * scale,
                2 * scale,
                0x000000
            ).setAngle(-18)
        );

        const mouth =
            this.add.graphics();

        mouth.lineStyle(
            2,
            0x000000
        );

        mouth.beginPath();

        mouth.arc(
            0,
            -18 * scale,
            9 * scale,
            Phaser.Math.DegToRad(200),
            Phaser.Math.DegToRad(340),
            true
        );

        mouth.strokePath();

        person.add(mouth);
    }
    else
    {
        const mouth =
            this.add.graphics();

        mouth.lineStyle(
            2,
            0x000000
        );

        mouth.beginPath();

        mouth.arc(
            0,
            -36 * scale,
            10 * scale,
            Phaser.Math.DegToRad(20),
            Phaser.Math.DegToRad(160),
            false
        );

        mouth.strokePath();

        person.add(mouth);
    }

    person.add(
        this.add.rectangle(
            0,
            8 * scale,
            46 * scale,
            64 * scale,
            shirtColor
        )
    );

    if (armPose === 'right')
    {
        person.add(
            this.add.rectangle(
                -32 * scale,
                10 * scale,
                10 * scale,
                52 * scale,
                skinColor
            )
        );

        person.add(
            this.add.rectangle(
                38 * scale,
                -2 * scale,
                58 * scale,
                9 * scale,
                skinColor
            ).setAngle(-7)
        );
    }
    else if (armPose === 'left')
    {
        person.add(
            this.add.rectangle(
                32 * scale,
                10 * scale,
                10 * scale,
                52 * scale,
                skinColor
            )
        );

        person.add(
            this.add.rectangle(
                -38 * scale,
                -2 * scale,
                58 * scale,
                9 * scale,
                skinColor
            ).setAngle(7)
        );
    }
    else
    {
        person.add(
            this.add.rectangle(
                -32 * scale,
                10 * scale,
                10 * scale,
                52 * scale,
                skinColor
            )
        );

        person.add(
            this.add.rectangle(
                32 * scale,
                10 * scale,
                10 * scale,
                52 * scale,
                skinColor
            )
        );
    }

    person.add(
        this.add.rectangle(
            -12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    person.add(
        this.add.rectangle(
            12 * scale,
            71 * scale,
            14 * scale,
            48 * scale,
            pantsColor
        )
    );

    this.addQuestionObject(person);

    return person;
}

showCooperationCompetitionQuestion ()
{
    this.clearQuestionScreen();

    const fixedFood =
        this.getFixedFoodCounts();

    const personADisplayFood =
        fixedFood.personA;

    const personBDisplayFood =
        fixedFood.personB;

    const personCDisplayFood =
        fixedFood.personC;

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            280,
            115,
            'Person A',
            0.78,
            0xcc3333,
            personADisplayFood
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            640,
            115,
            'Person B',
            0.72,
            0x3366cc,
            personBDisplayFood
        )
    );

    this.addQuestionObject(
        this.createStaticHumanAvatar(
            1000,
            115,
            'Person C',
            0.66,
            0x339966,
            personCDisplayFood
        )
    );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            455,
            1120,
            360,
            0xffffff
        )
    ).setStrokeStyle(4, 0x000000);

    this.addQuestionObject(
        this.add.text(
            640,
            330,
            'Do you think that the people in this group are probably more cooperative or competitive?',
            {
                fontSize: '28px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                },
                lineSpacing: 6
            }
        ).setOrigin(0.5)
    );

    const answers =
        Phaser.Utils.Array.Shuffle([
            'The people in this group are probably more competitive.',
            'The people in this group are probably more cooperative.'
        ]);

    this.createAnswerButton(
        640,
        455,
        answers[0],
        'cooperationCompetitionChoice'
    );

    this.createAnswerButton(
        640,
        560,
        answers[1],
        'cooperationCompetitionChoice'
    );
}

showSelfInterestRandomizationScreen ()
{
    if (!this.gameData.respondentRole)
    {
        this.gameData.selfInterestCondition =
            'not_assigned';

        this.gameData.selfInterestConditionIssue =
            'missing_or_invalid_income_third';

        this.gameData.respondentRoleRevealed =
            false;

        this.showNeutralSelfInterestScreen();
        return;
    }

    this.gameData.selfInterestCondition =
        this.assignSelfInterestCondition();

    if (
        this.gameData.selfInterestCondition ===
        'reveal'
    )
    {
        this.showRespondentRoleScreen();
    }
    else
    {
        this.showNeutralSelfInterestScreen();
    }
}

showNeutralSelfInterestScreen ()
{
    this.clearQuestionScreen();
    this.clearGameObjects();

    this.gameData.respondentRoleRevealed =
        false;

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            610,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            90,
            'Next, you will complete one final food-distribution task.',
            {
                fontSize: '32px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                }
            }
        ).setOrigin(0.5)
    );

    this.drawSelfInterestStartingRoles(
        null
    );

    this.createNextButton(
        640,
        675,
        'Continue',
        () => {
            this.startSelfInterestAllocation();
        }
    );
}

showRespondentRoleScreen ()
{
    this.clearQuestionScreen();
    this.clearGameObjects();

    this.gameData.respondentRoleRevealed =
        true;

    const respondentRole =
        this.gameData.respondentRole;

    const fixedFood =
        this.getFixedFoodCounts();

    const respondentFood = {
        'Person A': fixedFood.personA,
        'Person B': fixedFood.personB,
        'Person C': fixedFood.personC
    }[respondentRole];

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1120,
            610,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            70,
            `Imagine that you are ${respondentRole}, who is outlined in green. You have ${respondentFood} pieces of food.`,
            {
                fontSize: '32px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 980
                }
            }
        ).setOrigin(0.5)
    );

    this.drawSelfInterestStartingRoles(
        respondentRole
    );

    this.createNextButton(
        640,
        675,
        'Continue',
        () => {
            this.startSelfInterestAllocation();
        }
    );
}

drawSelfInterestStartingRoles (
    highlightedRole
)
{
    const fixedFood =
        this.getFixedFoodCounts();

    const roles = [
        {
            label: 'Person A',
            key: 'personA',
            x: 260,
            scale: 0.82,
            shirtColor: 0xcc3333
        },
        {
            label: 'Person B',
            key: 'personB',
            x: 640,
            scale: 0.76,
            shirtColor: 0x3366cc
        },
        {
            label: 'Person C',
            key: 'personC',
            x: 1020,
            scale: 0.70,
            shirtColor: 0x339966
        }
    ];

    roles.forEach(role => {
        if (
            role.label ===
            highlightedRole
        )
        {
            const outline =
                this.add.rectangle(
                    role.x,
                    405,
                    270,
                    345,
                    0xffffff,
                    0
                );

            outline.setStrokeStyle(
                6,
                0x1b6f3a
            );

            this.addQuestionObject(
                outline
            );
        }

        this.addQuestionObject(
            this.createStaticHumanAvatar(
                role.x,
                350,
                role.label,
                role.scale,
                role.shirtColor,
                fixedFood[role.key]
            )
        );
    });
}

startSelfInterestAllocation ()
{
    const fixedFood =
        this.getFixedFoodCounts();

    this.selfInterestCounts = {
        'Person A': fixedFood.personA,
        'Person B': fixedFood.personB,
        'Person C': fixedFood.personC
    };

    this.selfInterestEqualApplied =
        false;

    this.selfInterestPartialApplied =
        false;

    this.selfInterestAllocationSource =
        'starting_distribution';

    this.showSelfInterestAllocationTask();
}

showSelfInterestAllocationTask ()
{
    this.clearQuestionScreen();
    this.clearGameObjects();

    const fixedFood =
        this.getFixedFoodCounts();

    const revealRole =
        this.gameData.respondentRoleRevealed
            ? this.gameData.respondentRole
            : null;

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1240,
            700,
            0xffffff
        ).setStrokeStyle(
            3,
            0x000000
        )
    );

    this.addQuestionObject(
        this.add.text(
            640,
            24,
            'Arrange the food in the way you think is best.',
            {
                fontSize: '29px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 1150
                }
            }
        ).setOrigin(0.5, 0)
    );

    this.addQuestionObject(
        this.add.text(
            640,
            70,
            `There are ${fixedFood.total} pieces of food. Each person needs at least 5 pieces to survive. You may move any piece from one person to another.`,
            {
                fontSize: '20px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 1120
                }
            }
        ).setOrigin(0.5, 0)
    );

    const statusLine = revealRole
        ? `You are ${revealRole}, which is outlined in green.`
        : 'The total amount of food is fixed; no additional food can be collected.';

    this.addQuestionObject(
        this.add.text(
            640,
            125,
            statusLine,
            {
                fontSize: '17px',
                color:
                    revealRole
                        ? '#1b6f3a'
                        : '#555555',
                align: 'center',
                wordWrap: {
                    width: 1060
                }
            }
        ).setOrigin(0.5, 0)
    );

    const roles = [
        {
            label: 'Person A',
            x: 260,
            scale: 0.90,
            shirtColor: 0xcc3333
        },
        {
            label: 'Person B',
            x: 640,
            scale: 0.84,
            shirtColor: 0x3366cc
        },
        {
            label: 'Person C',
            x: 1020,
            scale: 0.78,
            shirtColor: 0x339966
        }
    ];

    this.selfInterestBaselineY = 330;
    this.selfInterestDropZones = {};
    this.selfInterestCountTexts = {};

    roles.forEach(role => {
        if (role.label === revealRole)
        {
            const outline =
                this.add.rectangle(
                    role.x,
                    350,
                    270,
                    390,
                    0xffffff,
                    0
                );

            outline.setStrokeStyle(
                6,
                0x1b6f3a
            );

            this.addQuestionObject(
                outline
            );
        }

        this.addQuestionObject(
            this.createStaticHumanAvatar(
                role.x,
                this.selfInterestBaselineY,
                role.label,
                role.scale,
                role.shirtColor,
                0
            )
        );

        const dropZone =
            this.add.zone(
                role.x,
                365,
                240,
                330
            ).setRectangleDropZone(
                240,
                330
            );

        this.selfInterestDropZones[
            role.label
        ] = dropZone;

        this.addQuestionObject(
            dropZone
        );

        const countText =
            this.add.text(
                role.x,
                510,
                '',
                {
                    fontSize: '20px',
                    color: '#000000'
                }
            ).setOrigin(0.5);

        this.selfInterestCountTexts[
            role.label
        ] = countText;

        this.addQuestionObject(
            countText
        );
    });

    this.selfInterestSummaryText =
        this.add.text(
            640,
            555,
            '',
            {
                fontSize: '21px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 1050
                }
            }
        ).setOrigin(0.5);

    this.addQuestionObject(
        this.selfInterestSummaryText
    );

    this.createSelfInterestFoodPieces();

    this.createSelfInterestActionButton(
        105,
        675,
        150,
        'Reset',
        () => {
            this.applySelfInterestAllocation(
                [
                    fixedFood.personA,
                    fixedFood.personB,
                    fixedFood.personC
                ],
                'starting_distribution'
            );
        },
        0xdddddd,
        '#000000'
    );

    this.createSelfInterestActionButton(
        390,
        675,
        300,
        'Redistribute to maximize survival',
        () => {
            this.applySelfInterestAllocation(
                this.buildSelfInterestPartialAllocation(),
                'partial_button'
            );
        },
        0xdddddd,
        '#000000'
    );

    this.createSelfInterestActionButton(
        720,
        675,
        240,
        'Divide equally',
        () => {
            const equalShare =
                fixedFood.total / 3;

            this.applySelfInterestAllocation(
                [
                    equalShare,
                    equalShare,
                    equalShare
                ],
                'equal_button'
            );
        },
        0xdddddd,
        '#000000'
    );

    this.createSelfInterestActionButton(
        1070,
        675,
        270,
        'Submit arrangement',
        () => {
            this.storeSelfInterestAllocation();
            this.showFinalGameScreen();
        }
    );
}

createSelfInterestFoodPieces ()
{
    const roles = [
        {
            label: 'Person A',
            amount:
                this.selfInterestCounts[
                    'Person A'
                ]
        },
        {
            label: 'Person B',
            amount:
                this.selfInterestCounts[
                    'Person B'
                ]
        },
        {
            label: 'Person C',
            amount:
                this.selfInterestCounts[
                    'Person C'
                ]
        }
    ];

    this.selfInterestFoods = [];

    roles.forEach(role => {
        for (
            let index = 0;
            index < role.amount;
            index += 1
        )
        {
            const food =
                this.add.circle(
                    0,
                    0,
                    7,
                    0xb22222
                );

            food.setStrokeStyle(
                1,
                0x000000
            );

            food.setInteractive(
                new Phaser.Geom.Circle(
                    0,
                    0,
                    28
                ),
                Phaser.Geom.Circle.Contains,
                {
                    useHandCursor: true
                }
            );

            food.setDepth(20);

            food.assignedPerson =
                role.label;

            this.input.setDraggable(
                food
            );

            food.on(
                'dragstart',
                () => {
                    food.setDepth(100);
                }
            );

            food.on(
                'drag',
                (
                    pointer,
                    dragX,
                    dragY
                ) => {
                    food.x = dragX;
                    food.y = dragY;
                }
            );

            food.on(
                'dragend',
                () => {
                    let destination = null;

                    Object.keys(
                        this.selfInterestDropZones
                    ).forEach(roleLabel => {
                        const bounds =
                            this.selfInterestDropZones[
                                roleLabel
                            ].getBounds();

                        if (
                            Phaser.Geom.Rectangle.Contains(
                                bounds,
                                food.x,
                                food.y
                            )
                        )
                        {
                            destination =
                                roleLabel;
                        }
                    });

                    if (
                        destination &&
                        destination !==
                            food.assignedPerson
                    )
                    {
                        this.selfInterestCounts[
                            food.assignedPerson
                        ] -= 1;

                        food.assignedPerson =
                            destination;

                        this.selfInterestCounts[
                            destination
                        ] += 1;

                        this.selfInterestEqualApplied =
                            false;

                        this.selfInterestPartialApplied =
                            false;

                        this.selfInterestAllocationSource =
                            'manual';
                    }

                    this.refreshSelfInterestFoodPositions();

                    food.setDepth(20);
                }
            );

            this.selfInterestFoods.push(
                food
            );

            this.addQuestionObject(
                food
            );
        }
    });

    this.refreshSelfInterestFoodPositions();
}

refreshSelfInterestFoodPositions ()
{
    const basketPositions = {
        'Person A': {
            x: 260 + 39 * 0.90,
            y:
                this.selfInterestBaselineY +
                31 * 0.90,
            scale: 0.90
        },

        'Person B': {
            x: 640 + 39 * 0.84,
            y:
                this.selfInterestBaselineY +
                31 * 0.84,
            scale: 0.84
        },

        'Person C': {
            x: 1020 + 39 * 0.78,
            y:
                this.selfInterestBaselineY +
                31 * 0.78,
            scale: 0.78
        }
    };

    const pileCounts = {
        'Person A': 0,
        'Person B': 0,
        'Person C': 0
    };

    this.selfInterestFoods.forEach(
        food => {
            const roleLabel =
                food.assignedPerson;

            const pilePosition =
                pileCounts[
                    roleLabel
                ];

            const basket =
                basketPositions[
                    roleLabel
                ];

            pileCounts[
                roleLabel
            ] += 1;

            food.x =
                basket.x +
                (
                    (pilePosition % 3) -
                    1
                ) *
                15 *
                basket.scale;

            food.y =
                basket.y -
                6 * basket.scale +
                Math.floor(
                    pilePosition / 3
                ) *
                13 *
                basket.scale;
        }
    );

    Object.keys(
        this.selfInterestCountTexts
    ).forEach(roleLabel => {
        const amount =
            this.selfInterestCounts[
                roleLabel
            ];

        this.selfInterestCountTexts[
            roleLabel
        ].setText(
            `${amount} ${amount === 1 ? 'piece' : 'pieces'}`
        );
    });

    const survivors =
        Object.values(
            this.selfInterestCounts
        ).filter(
            amount => amount >= 5
        ).length;
}

applySelfInterestAllocation (
    allocation,
    source
)
{
    const totalAssigned =
        allocation.reduce(
            (sum, amount) =>
                sum + amount,
            0
        );

    if (
        totalAssigned !==
            this.selfInterestFoods.length ||
        allocation.some(
            amount =>
                !Number.isInteger(amount) ||
                amount < 0
        )
    )
    {
        throw new Error(
            'Invalid self-interest allocation preset.'
        );
    }

    const roleLabels = [
        'Person A',
        'Person B',
        'Person C'
    ];

    let foodIndex = 0;

    roleLabels.forEach(
        (roleLabel, roleIndex) => {
            this.selfInterestCounts[
                roleLabel
            ] =
                allocation[
                    roleIndex
                ];

            for (
                let count = 0;
                count <
                    allocation[
                        roleIndex
                    ];
                count += 1
            )
            {
                this.selfInterestFoods[
                    foodIndex
                ].assignedPerson =
                    roleLabel;

                foodIndex += 1;
            }
        }
    );

    this.selfInterestAllocationSource =
        source;

    this.selfInterestEqualApplied =
        source === 'equal_button';

    this.selfInterestPartialApplied =
        source === 'partial_button';

    this.refreshSelfInterestFoodPositions();
}

buildSelfInterestPartialAllocation ()
{
    return this.buildSurplusOnlyPartialAllocation();
}

createSelfInterestActionButton (
    centerX,
    centerY,
    width,
    label,
    callback,
    fillColor = 0x000000,
    textColor = '#ffffff'
)
{
    const button =
        this.add.rectangle(
            centerX,
            centerY,
            width,
            52,
            fillColor
        );

    button.setStrokeStyle(
        2,
        0x000000
    );

    button.setInteractive({
        useHandCursor: true
    });

    button.setDepth(1000);

    const text =
        this.add.text(
            centerX,
            centerY,
            label,
            {
                fontSize: '18px',
                color: textColor,
                align: 'center',
                wordWrap: {
                    width:
                        width - 18
                }
            }
        ).setOrigin(0.5);

    text.setInteractive({
        useHandCursor: true
    });

    text.setDepth(1001);

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    button.on(
        'pointerdown',
        callback
    );

    text.on(
        'pointerdown',
        callback
    );
}

storeSelfInterestAllocation ()
{
    const fixedFood =
        this.getFixedFoodCounts();

    const startingAllocation = [
        fixedFood.personA,
        fixedFood.personB,
        fixedFood.personC
    ];

    const finalAllocation = [
        this.selfInterestCounts[
            'Person A'
        ],
        this.selfInterestCounts[
            'Person B'
        ],
        this.selfInterestCounts[
            'Person C'
        ]
    ];

    const survivors =
        finalAllocation.filter(
            amount => amount >= 5
        ).length;

    const totalMoved =
        finalAllocation.reduce(
            (
                sum,
                amount,
                index
            ) =>
                sum +
                Math.abs(
                    amount -
                    startingAllocation[
                        index
                    ]
                ),
            0
        ) / 2;

    this.gameData.selfInterestAllocationFinal = {
        personA: finalAllocation[0],
        personB: finalAllocation[1],
        personC: finalAllocation[2]
    };

    this.gameData.selfInterestAllocationSurvivors =
        survivors;

    this.gameData.selfInterestAllocationGini =
        this.calculateAllocationGini(
            finalAllocation
        );

    this.gameData.selfInterestAllocationClassification =
        this.classifySelfInterestAllocation(
            finalAllocation,
            startingAllocation
        );

    this.gameData.selfInterestAllocationTotalMoved =
        totalMoved;

    this.gameData.selfInterestAllocationMethod =
        this.selfInterestAllocationSource;

    this.gameData.selfInterestEqualButtonUsed =
        this.selfInterestEqualApplied;

    this.gameData.selfInterestPartialButtonUsed =
        this.selfInterestPartialApplied;

    const roleIndex = {
        'Person A': 0,
        'Person B': 1,
        'Person C': 2
    }[
        this.gameData.respondentRole
    ];

    if (
        Number.isInteger(
            roleIndex
        )
    )
    {
        this.gameData.selfInterestOwnStartingFood =
            startingAllocation[
                roleIndex
            ];

        this.gameData.selfInterestOwnFinalFood =
            finalAllocation[
                roleIndex
            ];

        this.gameData.selfInterestOwnChange =
            finalAllocation[
                roleIndex
            ] -
            startingAllocation[
                roleIndex
            ];
    }
}

classifySelfInterestAllocation (
    finalAllocation,
    startingAllocation
)
{
    const allocationsMatch =
        (left, right) =>
            left.every(
                (amount, index) =>
                    amount ===
                    right[index]
            );

    if (
        allocationsMatch(
            finalAllocation,
            startingAllocation
        )
    )
    {
        return 'starting_distribution';
    }

    if (
        finalAllocation.every(
            amount =>
                amount ===
                finalAllocation[0]
        )
    )
    {
        return 'equal_distribution';
    }

    if (
        allocationsMatch(
            finalAllocation,
            this.buildSelfInterestPartialAllocation()
        )
    )
    {
        return 'acquisition_priority_maximum_survival';
    }

    const maximumSurvivors =
        Math.min(
            finalAllocation.length,
            Math.floor(
                finalAllocation.reduce(
                    (sum, amount) =>
                        sum + amount,
                    0
                ) / 5
            )
        );

    const survivors =
        finalAllocation.filter(
            amount => amount >= 5
        ).length;

    if (
        survivors ===
        maximumSurvivors
    )
    {
        return 'other_maximum_survival';
    }

    return 'other_distribution';
}

calculateAllocationGini (values)
{
    const total =
        values.reduce(
            (sum, amount) =>
                sum + amount,
            0
        );

    if (
        values.length === 0 ||
        total === 0
    )
    {
        return 0;
    }

    let absoluteDifferenceSum = 0;

    values.forEach(left => {
        values.forEach(right => {
            absoluteDifferenceSum +=
                Math.abs(
                    left - right
                );
        });
    });

    return Number(
        (
            absoluteDifferenceSum /
            (
                2 *
                values.length *
                total
            )
        ).toFixed(4)
    );
}

notifyQualtricsComplete (saveStatus)
{
    if (!this.qualtricsParentOrigin)
    {
        console.warn(
            'Qualtrics completion message was not sent because parentOrigin is missing or invalid.'
        );

        return false;
    }

    if (
        !window.opener ||
        window.opener.closed
    )
    {
        console.warn(
            'Qualtrics completion message was not sent because the survey window is unavailable.'
        );

        return false;
    }

    const completionMessage = {
        type: 'survival-game-complete',

        gameId:
            this.gameData.gameId,

        qualtricsId:
            this.gameData.qualtricsId,

        saveStatus:
            saveStatus,

        summary: {
            condition:
                this.gameData.condition,

            gameVersion:
                this.gameData.gameVersion,

            respondentDecile:
                this.gameData.respondentDecile,

            respondentIncomeThird:
                this.gameData.respondentIncomeThird,

            respondentRole:
                this.gameData.respondentRole,

            selfInterestCondition:
                this.gameData.selfInterestCondition,

            selfInterestAllocationFinal:
                this.gameData.selfInterestAllocationFinal,

            selfInterestOwnChange:
                this.gameData.selfInterestOwnChange,

            equalDivisionFinal:
                this.gameData.equalDivisionFinal,

            partialRedistributionFinal:
                this.gameData.partialRedistributionFinal
        }
    };

    window.opener.postMessage(
        completionMessage,
        this.qualtricsParentOrigin
    );

    this.gameData.completionMessageSent =
        true;

    console.log(
        'Qualtrics completion message sent:',
        completionMessage
    );

    return true;
}
saveGameDataToGoogleSheets ()
{
    const googleScriptUrl =
        'https://script.google.com/macros/s/AKfycbxm-CcPybco-VELZbg42X4gnxIH2czlAHBXRoQGN-HU4ExkAZ1PVmL60ki03yG03q9O/exec';

    this.gameData.saveStatus =
        'attempted';

    console.log(
        'GOOGLE SCRIPT URL:',
        googleScriptUrl
    );

    console.log(
        'DATA BEING SENT:',
        JSON.stringify(
            this.gameData
        )
    );

    return fetch(
        googleScriptUrl,
        {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            body:
                JSON.stringify(
                    this.gameData
                )
        }
    );
}

showFinalGameScreen ()
{
    this.clearQuestionScreen();

    this.gameData.gameEndTime =
        new Date().toISOString();

    this.gameData.totalDurationMs =
        new Date(
            this.gameData.gameEndTime
        ) -
        new Date(
            this.gameData.gameStartTime
        );

    this.addQuestionObject(
        this.add.rectangle(
            640,
            360,
            1000,
            500,
            0xffffff
        ).setStrokeStyle(
            4,
            0x000000
        )
    );

    const statusText =
        this.add.text(
            640,
            270,
            'Thank you for completing the survival game.\n\nSaving your responses...',
            {
                fontSize: '30px',
                color: '#000000',
                align: 'center',
                wordWrap: {
                    width: 850
                },
                lineSpacing: 10
            }
        ).setOrigin(0.5);

    this.addQuestionObject(
        statusText
    );

    const showCloseButton = () => {
        const closeButton =
            this.add.rectangle(
                640,
                540,
                360,
                65,
                0x000000
            );

        closeButton.setInteractive({
            useHandCursor: true
        });

        closeButton.setDepth(50);

        const closeText =
            this.add.text(
                640,
                540,
                'Close Game Tab',
                {
                    fontSize: '28px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

        closeText.setInteractive({
            useHandCursor: true
        });

        closeText.setDepth(51);

        this.addQuestionObject(
            closeButton
        );

        this.addQuestionObject(
            closeText
        );

        const closeGameTab = () => {
            window.close();

            this.addQuestionObject(
                this.add.text(
                    640,
                    630,
                    'If this tab does not close automatically, close it manually and return to the survey tab.',
                    {
                        fontSize: '22px',
                        color: '#000000',
                        align: 'center',
                        wordWrap: {
                            width: 850
                        }
                    }
                ).setOrigin(0.5)
            );
        };

        closeButton.on(
            'pointerdown',
            closeGameTab
        );

        closeText.on(
            'pointerdown',
            closeGameTab
        );
    };

    /*
     * Report completion immediately. This does not
     * contain or enforce any minimum-duration rule.
     */
    this.gameData.saveStatus =
        'attempted';

    this.notifyQualtricsComplete(
        'attempted'
    );

    this.saveGameDataToGoogleSheets()
        .then(() => {
            this.gameData.saveStatus =
                'request_sent';

            this.notifyQualtricsComplete(
                'request_sent'
            );

            statusText.setText(
                'Thank you for completing the survival game.\n\nYour save request was sent. Return to the survey when you are ready.'
            );

            showCloseButton();

            console.log(
                'Google Sheets save request sent.'
            );
        })
        .catch(error => {
            this.gameData.saveStatus =
                'request_failed';

            this.notifyQualtricsComplete(
                'request_failed'
            );

            statusText.setText(
                'Thank you for completing the survival game.\n\nThe game is complete, but the Google Sheets request could not be sent. A backup summary was returned to the survey.'
            );

            showCloseButton();

            console.error(
                'Google Sheets save failed:',
                error
            );
        });

    console.log(
        'FINAL GAME DATA:',
        this.gameData
    );
}

createAnswerButton (
    centerX,
    centerY,
    label,
    variableName
)
{
    const paddingX = 24;
    const paddingY = 14;

    const text = this.add.text(
        centerX,
        centerY,
        label,
        {
            fontSize: '22px',
            color: '#000000',
            align: 'center',
            wordWrap: {
                width: 1000
            }
        }
    ).setOrigin(0.5);

    const button =
        this.add.rectangle(
            centerX,
            centerY,
            text.width +
                paddingX * 2,
            text.height +
                paddingY * 2,
            0xdddddd
        );

    button.setStrokeStyle(
        2,
        0x000000
    );

    button.setInteractive(
        new Phaser.Geom.Rectangle(
            -(
                button.width + 40
            ) / 2,
            -(
                button.height + 30
            ) / 2,
            button.width + 40,
            button.height + 30
        ),
        Phaser.Geom.Rectangle.Contains
    );

    button.setDepth(1);
    text.setDepth(2);

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    if (
        !this.answerButtons[
            variableName
        ]
    )
    {
        this.answerButtons[
            variableName
        ] = [];
    }

    this.answerButtons[
        variableName
    ].push(button);

    button.on(
        'pointerdown',
        () => {
            this.answerButtons[
                variableName
            ].forEach(choice => {
                choice.setStrokeStyle(
                    2,
                    0x000000
                );
            });

            button.setStrokeStyle(
                5,
                0x000000
            );

            this.gameData[
                variableName
            ] = label;

            console.log(
                'Saved answer:',
                variableName,
                label
            );

            if (
                this.currentNextButton
            )
            {
                this.currentNextButton.destroy();
                this.currentNextButton = null;
            }

            if (
                this.currentNextText
            )
            {
                this.currentNextText.destroy();
                this.currentNextText = null;
            }

            const addNext =
                (
                    callback,
                    y = 675
                ) => {
                    this.createNextButton(
                        640,
                        y,
                        'Next',
                        callback
                    );
                };

            if (
                variableName ===
                'totalFoodEstimate'
            )
            {
                addNext(() => {
                    if (
                        this.isMobileDevice() &&
                        this.isPortraitMode()
                    )
                    {
                        this.showRotatePhoneScreen(
                            this.showEqualDivisionTask
                        );
                    }
                    else
                    {
                        this.showEqualDivisionTask();
                    }
                });
            }

            else if (
                variableName ===
                'perCapitaEstimate'
            )
            {
                addNext(() => {
                    this.showGroupDistributionPreferenceQuestion();
                });
            }

            else if (
                variableName ===
                'groupDistributionPreference'
            )
            {
                addNext(() => {
                    if (
                        this.isMobileDevice() &&
                        this.isPortraitMode()
                    )
                    {
                        this.showRotatePhoneScreen(
                            this.showPartialRedistributionTask
                        );
                    }
                    else
                    {
                        this.showPartialRedistributionTask();
                    }
                });
            }

            else if (
                variableName ===
                'partialRedistributionPreference'
            )
            {
                addNext(() => {
                    this.showDistributivePrincipleQuestion();
                });
            }

            else if (
                variableName ===
                'distributivePrinciplePriority'
            )
            {
                addNext(() => {
                    this.showSocialContractQuestion();
                });
            }

            else if (
                variableName ===
                'socialContractGuarantee'
            )
            {
                addNext(() => {
                    this.showSurvivalRedistributionQuestion();
                });
            }

            else if (
                variableName ===
                'personalVsGroupResponsibility'
            )
            {
                addNext(() => {
                    this.showFairRuleQuestion();
                });
            }

            else if (
                variableName ===
                'fairRuleChoice'
            )
            {
                addNext(() => {
                    this.showFoodRankReminderScreen();
                });
            }

            else if (
                variableName ===
                'foodPriorityChoice'
            )
            {
                addNext(() => {
                    this.showHardWorkReminderScreen();
                });
            }

            else if (
                variableName ===
                'workBreakChoice'
            )
            {
                addNext(() => {
                    this.showFloodRiskInstructionScreen();
                });
            }

            else if (
                variableName ===
                'floodPreparationChoice'
            )
            {
                addNext(() => {
                    this.showPersonDInstructionScreen();
                });
            }

            else if (
                variableName ===
                'personDShareChoice'
            )
            {
                addNext(() => {
                    this.showPersonDEmpathyQuestion();
                });
            }

            else if (
                variableName ===
                'personDEmpathyChoice'
            )
            {
                addNext(() => {
                    this.showCooperationCompetitionInstructionScreen();
                });
            }

            else if (
                variableName ===
                'cooperationCompetitionChoice'
            )
            {
                addNext(() => {
                    this.showSelfInterestRandomizationScreen();
                });
            }
        }
    );
}

getButtonStyle ()
{
    return {
        width: 220,
        height: 60,
        fontSize: '28px',
        fillColor: 0x000000,
        textColor: '#ffffff'
    };
}


showNextTaskButtonAt (
    x,
    y,
    callback
)
{
    const buttonY = 685;

    const button =
        this.add.rectangle(
            x,
            buttonY,
            160,
            55,
            0x000000
        );

    button.setInteractive({
        useHandCursor: true
    });

    button.setDepth(50);

    const text =
        this.add.text(
            x,
            buttonY,
            'Next',
            {
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

    text.setInteractive({
        useHandCursor: true
    });

    text.setDepth(51);

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    const goNext = () => {
        callback();
    };

    button.on(
        'pointerdown',
        goNext
    );

    text.on(
        'pointerdown',
        goNext
    );
}

showNextTaskButton (callback)
{
    const buttonY = 685;

    const button =
        this.add.rectangle(
            640,
            buttonY,
            160,
            55,
            0x000000
        );

    button.setInteractive({
        useHandCursor: true
    });

    button.setDepth(50);

    const text =
        this.add.text(
            640,
            buttonY,
            'Next',
            {
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

    text.setInteractive({
        useHandCursor: true
    });

    text.setDepth(51);

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    const goNext = () => {
        callback();
    };

    button.on(
        'pointerdown',
        goNext
    );

    text.on(
        'pointerdown',
        goNext
    );
}

createGameNextButton (
    x,
    y,
    label,
    callback
)
{
    const buttonY = 685;

    const button =
        this.add.rectangle(
            x,
            buttonY,
            160,
            55,
            0x000000
        );

    button.setInteractive({
        useHandCursor: true
    });

    const text =
        this.add.text(
            x,
            buttonY,
            label,
            {
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

    button.setDepth(1);
    text.setDepth(2);

    this.addGameObject(button);
    this.addGameObject(text);

    button.on(
        'pointerdown',
        callback
    );

    text.on(
        'pointerdown',
        callback
    );
}

createNextButton (
    x,
    y,
    label,
    callback
)
{
    const buttonY = y;

    const button =
        this.add.rectangle(
            x,
            buttonY,
            160,
            55,
            0x000000
        );

    button.setInteractive({
        useHandCursor: true
    });

    button.setDepth(1000);

    const text =
        this.add.text(
            x,
            buttonY,
            label,
            {
                fontSize: '26px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

    text.setInteractive({
        useHandCursor: true
    });

    text.setDepth(1001);

    this.currentNextButton =
        button;

    this.currentNextText =
        text;

    this.addQuestionObject(button);
    this.addQuestionObject(text);

    const goNext = () => {
        callback();
    };

    button.on(
        'pointerdown',
        goNext
    );

    text.on(
        'pointerdown',
        goNext
    );
}

addQuestionObject (object)
{
    this.questionObjects.push(
        object
    );

    return object;
}

addGameObject (object)
{
    this.gameObjects.push(
        object
    );

    return object;
}

clearQuestionScreen ()
{
    if (!this.questionObjects)
    {
        return;
    }

    this.questionObjects.forEach(
        object => {
            if (
                object &&
                object.destroy
            )
            {
                object.destroy();
            }
        }
    );

    this.questionObjects = [];
    this.answerButtons = [];
}

clearGameObjects ()
{
    if (!this.gameObjects)
    {
        return;
    }

    this.gameObjects.forEach(
        object => {
            if (
                object &&
                object.destroy
            )
            {
                object.destroy();
            }
        }
    );

    this.gameObjects = [];
}
}