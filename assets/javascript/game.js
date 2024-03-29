let attackMultiplier = 1
let chosen = -1
let defender = -1
let chosenHP = 0
let defenderHP = 0
// Pause input to prevent breaking
let isPaused = false
let isBattleOver = false
// Indices of unpicked characters
let unselected = [0, 1, 2, 3]

const hide = x => {
    x.css('height', '0')
    x.css('visibility', 'hidden')
}
const show = x => {
    x.css('height', 'auto')
    x.css('visibility', 'visible')
}

const randomAttack = _ => attacks[Math.floor(Math.random() * (attacks.length - 0.001))]

// Adding animate.css animations to elements
const animateCSS = (element, animationName, callback) => {
    const node = document.querySelector(element)
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

// ***** Pick Characters *****

// Pick character
const pickCharacter = _ => {
    console.log('running pickCharacter')
    // Show correct div
    hide($('.row').not('.container'))
    show($('#choose-row'))
    hide($('.battle-options-row'))
    // Populate div with unselected characters
    unselected.forEach(x => {
        let char = characters[x]
        let pokeballID = `${char.id}-pokeball`
        // Add pokeball for character
        console.log(`Adding pokeball for index ${x}`)
        $('#choose-screen').append(`
            <div id="${char.id}-container" class="pokeball">
                <img src="./assets/images/Pokeball-still.png" alt="Pokeball" class="px-4 no-outline" id="${pokeballID}" data-index="${x}">
            </div>
        `)
        // Add hover animation for pokeball
        $(`#${pokeballID}`).hover(
            function () {
                $(`#${pokeballID}`).attr('src', './assets/images/pokeball-moving.gif')
            }, function () {
                $(`#${pokeballID}`).attr('src', './assets/images/Pokeball-still.png')
            }
        )
        // Add tooltip for pokeball
        tippy(`#${pokeballID}`, {
            arrow: true,
            animation: 'fade',
            allowHTML: true,
            content(reference) {
                console.log(char)
                let popover = document.createElement('div')
                popover.innerHTML = `
                    <img src=${char.img} alt="${char.name}" class="popover-img">
                    <br>
                    <strong>${char.name}</strong>
                `
                return popover
            }
        })
        console.log(`Adding ${char.name}`)
    })
    // Clicking will assign character to chosen or defender
    $(`[id$=-pokeball]`).click(function (event) {
        let index = this.dataset.index
        // Remove picked character from unselected
        unselected.splice(unselected.indexOf(index), 1)
        $(this.parentNode).remove()
        console.log(`Chosen: ${chosen}, Defender: ${defender}`)
        if (chosen === -1) {
            // Chosen not picked
            chosen = index
            chosenHP = characters[chosen].hp
            console.log('character chosen, choose enemy')
            $('#choose-title').text(`Choose your Enemy!`)
        } else {
            // Chosen already picked
            defender = index
            defenderHP = characters[defender].hp
            setupBattle()
        }
    })
}

// ***** Battle *****

const setupBattle = _ => {
    console.log('running battle')
    // Show correct divs
    hide($('.row').not('.container'))
    show($('#battle-row'))
    console.log($('#battle-log-options-container'))
    show($('#battle-log-options-container'))
    // Setup chosen
    let chosenChar = `<img src="./assets/images/${characters[chosen].id}-cartoon.png" alt="chosen" id="chosen-img" class="character-img">`
    $(`#chosen-container`).html(chosenChar)
    $(`#chosen-title`).text(characters[chosen].name)
    // Setup defender
    let defenderChar = `<img src="./assets/images/${characters[defender].id}-cartoon.png" alt="defender" id="defender-img" class="character-img">`
    $(`#defender-container`).html(defenderChar)
    $('#defender-title').text(characters[defender].name)
    $('#defender-health').animate({ width: '100%' }, 200)
    // Setup battle text-box
    $('#battle-log').text(`Wild ${characters[defender].name.toUpperCase()} appeared!`)
    // Start battle on mouse click
    setTimeout(_ => document.getElementsByTagName('body')[0].addEventListener('click', startBattle), 300)

}

const startBattle = event => {
    console.log('starting battle')
    // Options show when battle starts
    show($(`.battle-options-row`))
    $('#battle-log').text(`What will ${characters[chosen].name.toUpperCase()} do?`)
    document.getElementsByTagName('body')[0].removeEventListener('click', startBattle)

    // $('.battle-option').click(function (event) {
    $('body').on('click', '.battle-option', event => {
        console.log(event)
        // If waiting for counter or battle is won, don't receive input
        if (isPaused || isBattleOver) {
            return
        }
        isPaused = true
        switch (event.currentTarget.textContent) {
            case 'FIGHT':
                chosenAttack()
                // Pause before defender counters
                setTimeout(_ => {
                    defenderCounter()
                }, 2500)
                break
            case 'BAG':
                $('#battle-log').text(`You're too poor to buy items!`)
                break
            case 'POKéMON':
                $('#battle-log').text(`You're too poor to feed more pokémon!`)
                break
            case 'RUN':
                $('#battle-log').text(`Can't escape!`)
                break
            default:
                break
        }
        setTimeout(_ => {
            isPaused = false
            // Nothing else to do if battle is won
            !isBattleOver ? $('#battle-log').text(`What will ${characters[chosen].name.toUpperCase()} do?`) : ''
        }, 5000)
    })
}

const chosenAttack = _ => {
    $('#battle-log').text(`${characters[chosen].name} used ${randomAttack()}!`)
    // Update defenderHP
    console.log(`Attack Multiplier: ${attackMultiplier}`)
    defenderHP -= attackMultiplier * characters[chosen].attack
    // Animate attack
    animateCSS('#chosen-img', 'tada', _ => {
        animateCSS('#defender-img', 'wobble')
    })
    $(`#defender-health`).animate({ width: `${Math.floor(defenderHP / characters[defender].hp * 100)}%` }, 200)
    attackMultiplier++
    // Defender fainted
    if (defenderHP <= 0) {
        isBattleOver = true
        setTimeout(_ => {
            $('#battle-log').text(`Wild ${characters[defender].name.toUpperCase()} fainted!`)
            setTimeout(_ => document.getElementsByTagName('body')[0].addEventListener('click', winBattle), 300)
        }, 2500)
    }
    console.log(defenderHP)
}

const defenderCounter = _ => {
    if (isBattleOver) {
        return
    }
    $('#battle-log').text(`${characters[defender].name} countered with ${randomAttack()}!`)
    // Update chosenHP
    chosenHP -= characters[defender].counter
    // Animating Attack
    animateCSS('#defender-img', 'tada', _ => {
        animateCSS('#chosen-img', 'wobble')
    })
    $(`#chosen-health`).animate({ width: `${Math.floor(chosenHP / characters[chosen].hp * 100)}%` }, 400)
    // Lose Condition
    if (chosenHP <= 0) {
        isBattleOver = true
        setTimeout(_ => {
            $('#battle-log').text(`${characters[chosen].name} fainted! You lose!`)
            setTimeout(_ => document.getElementsByTagName('body')[0].addEventListener('click', lose), 300)
        }, 2500)
    }
}

// Won current battle
const winBattle = _ => {
    // Turn off event listeners
    document.getElementsByTagName('body')[0].removeEventListener('click', winBattle)
    $('body').off('click', '.battle-option')
    // Check number of opponents left
    if (unselected.length < 1) {
        // Win Condition
        console.log('You Win!!')
        win()
    } else {
        // Pick another opponent after 3 seconds
        isBattleOver = false
        hide($('.row').not('.container'))
        show($('#choose-row'))
        hide($('.battle-options-row'))
    }
}


// ***** End Game *****

const win = _ => {
    swal({
        title: 'Congratulations!',
        text: 'You defeated all your opponents! Good job!',
        icon: 'success'
    })
    resetGame()
}

const lose = _ => {
    // Turn off event listeners
    document.getElementsByTagName('body')[0].removeEventListener('click', lose)
    $('body').off('click', '.battle-option')
    swal({
        title: 'You Lost!',
        text: 'You should just give up!',
        icon: 'error'
    })
    resetGame()
}

// Reset variables, then run pickCharacter()
const resetGame = _ => {
    attackMultiplier = 1
    chosen = -1
    defender = -1
    chosenHP = 0
    defenderHP = 0
    isPaused = false
    isBattleOver = false
    unselected = [0, 1, 2, 3]
    $('#choose-title').text(`Choose your Character!`)
    $('.pokeball').remove()
    $('#chosen-health').css('width', '100%')
    $('#defender-health').css('width', '100%')
    pickCharacter()
}


// Start game
resetGame()