import { firstSentence, wikiLink, formatRealDistance } from './distance.js';
import { MOON_WONDERS } from './moons.js';

const WONDERS = {
    '0': 'Every second, the Sun turns about 600 million tonnes of hydrogen into light. That light takes 8 minutes to reach Earth.',
    '1': 'A year on Mercury is 88 Earth days, but sunrise to sunrise takes 176. One day there lasts two whole years.',
    '2': 'Venus spins backwards, and a day there is longer than its year. The air is thick enough to crush a submarine.',
    '3': 'Earth is the only world we know with oceans, weather, and life. Its magnetic field keeps the solar wind from blowing the air away.',
    '4': 'Mars has the tallest volcano in the solar system, Olympus Mons, nearly three times the height of Everest.',
    '5': 'Jupiter is so big that every other planet could fit inside it. The Great Red Spot is a storm older than telescopes.',
    '6': 'Saturn is the only planet light enough to float in water. Its rings are billions of chunks of ice, some no bigger than a house.',
    '7': 'Uranus rolls around the Sun on its side. For decades, one pole faces the sunlight while the other stays in night.',
    '8': 'Neptune has the fastest winds in the solar system, faster than a jet plane, on a world of deep blue ice and gas.',
    '9': 'The Moon is drifting away from Earth about as fast as fingernails grow. The same side always faces us.',
    pluto: 'Pluto has a bright heart of nitrogen ice. A year there lasts 248 Earth years.',
    voyager1: 'Voyager 1 is the farthest thing humans have ever built. It carries a golden record of Earth\'s music, voices, and pictures.',
    proxima: 'Proxima Centauri is the nearest star beyond the Sun. Its light still takes 4.2 years to get here.',
    'proxima-b': 'A year on Proxima b lasts only 11 days. It might be warm enough for liquid water, if it kept an atmosphere through the star\'s flares.',
    sirius: 'Sirius is the brightest star in the night sky. Its companion, Sirius B, is a white dwarf so dense that a teaspoon would weigh tonnes.',
    orion: 'The Orion Nebula is a stellar nursery. New stars are switching on there right now, about 1,300 light-years away.',
    horsehead: 'A dark cloud of dust stands in front of a glowing curtain of hydrogen, and the silhouette is a horse\'s head.',
    helix: 'This is the future of the Sun: the outer layers of a dying star, blown into an eye of gas around a white dwarf.',
    crab: 'In 1054 people on Earth watched a star explode. What is left is this tangle of filaments and a pulsar spinning thirty times a second.',
    eagle: 'These towers of gas and dust are several light-years tall. New stars are forming in the tips while the light of hotter stars boils the columns away.',
    carina: 'Eta Carinae, buried in this cloud, erupted in the 1840s and became one of the brightest stars in the sky. It is still not finished.',
    rosette: 'Young stars have blown a hole through the middle of this cloud, and the rim still looks like the petals of a rose.',
    ring: 'A dying star threw off its atmosphere, and we are looking down the barrel of the shell it left behind.',
    catseye: 'The rings were shed in pulses, about a thousand years apart. The bright centre is the exposed core of the star.',
    lagoon: 'A dark lane of dust splits this star-forming cloud, which is why it was named for a lagoon.',
    butterfly: 'The wings are gas thrown off by a dying star so hot it shines mostly in ultraviolet. A dusty ring pinches the outflow into two lobes.',
    hubble: 'Above the blur of the air, Hubble has been taking the pictures that changed astronomy since 1990. Take a look through the camera for the landmark frames.',
    jwst: 'James Webb watches in infrared from a point a million miles from Earth, with a gold mirror wider than Hubble’s whole telescope. Take a look for what it has already found, and what it is still reaching for.',
    pleiades: 'The Pleiades are a handful of hot blue stars born together, only about 100 million years old.',
    andromeda: 'Andromeda is a galaxy of about a trillion stars. It is falling toward the Milky Way, and the two will meet in billions of years.',
    'sgr-a': 'Sagittarius A* weighs as much as four million Suns. The black circle is its shadow. Light skims the edge in a bright ring, and the far side of the glowing disk is bent over the top. The bright side is gas rushing toward us.',
    ...MOON_WONDERS
};

const NOTES = {
    '0': [
        'The light leaving the surface spent tens of thousands of years working its way out of the core, then eight minutes crossing to Earth.',
        'Sunspots look dark only because the magnetic storms there are cooler than the blinding surface around them.',
        'In about five billion years it swells into a red giant, sheds its outer layers, and leaves a white dwarf behind.'
    ],
    '1': [
        'The crust is wrinkled like a dried apple. Mercury shrank as its iron core cooled, and the surface crumpled.',
        'With almost no air, the day side bakes while the night side freezes, only a short walk apart.',
        'Ice sits in craters at the poles, in shadows the Sun never reaches.'
    ],
    '2': [
        'The clouds are sulfuric acid, and a runaway greenhouse keeps the ground hotter than Mercury.',
        'The Sun rises in the west. A day here lasts longer than the year.',
        'Under the clouds, radar found volcanoes, lava plains, and craters that do not last long.'
    ],
    '3': [
        'The oxygen in the air was put there by life. Microbes and plants rewrote the atmosphere.',
        'The Moon lifts the oceans, and that same tug is slowly lengthening the day.',
        'A molten iron core, stirred by the spin, builds the magnetic field that turns the solar wind aside.'
    ],
    '4': [
        'Olympus Mons is so wide its base would cover France, and the summit sits above most of the air.',
        'Valles Marineris would stretch across a continent. It is a crack in the crust, not a river canyon.',
        'Rovers have driven across lakebeds and river deltas. Water ran here, then the air thinned and it froze.'
    ],
    '5': [
        'The Great Red Spot has been raging for centuries, a storm wider than Earth.',
        'Its magnetic field is the largest structure in the solar system, a vast bubble of trapped particles.',
        'The four big moons are worlds of their own: a volcano, an ocean, a magnetic field, and a fossil surface.'
    ],
    '6': [
        'The rings are tens of thousands of kilometres across and only a few tens of metres thick, a sheet of orbiting ice.',
        'Cassini slipped through the gap between the planet and the rings on its final dives.',
        'A hexagon of clouds turns at the north pole, a standing wave bigger than Earth.'
    ],
    '7': [
        'Something knocked it onto its side, so a season lasts about twenty years and the poles take turns in the light.',
        'The faint rings were found by accident, when the planet passed in front of a star and the star blinked.',
        'Voyager 2 is still the only spacecraft to have flown past.'
    ],
    '8': [
        'It was found with mathematics. Uranus was being pulled off course, and astronomers pointed a telescope where the culprit had to be.',
        'Voyager 2 saw a storm the size of Earth. A few years later, the storm was gone.',
        'Triton, the big moon, orbits backwards and is slowly spiraling inward.'
    ],
    '9': [
        'The dark patches are ancient lava seas. The bright highlands are older, and far more cratered.',
        'Apollo footprints will last millions of years. There is no wind to erase them.',
        'The far side, which Earth never sees, has a thicker crust and almost none of those dark seas.'
    ],
    pluto: [
        'The bright heart, Sputnik Planitia, is a glacier of nitrogen ice that may still be slowly churning.',
        'Pluto and Charon face each other forever, circling a point in space that sits outside Pluto itself.',
        'New Horizons found mountains of water ice and a blue haze on a world once thought frozen solid.'
    ],
    voyager1: [
        'The Golden Record holds greetings, music, and a map that points back to Earth.',
        'The transmitter is about as strong as a refrigerator bulb. The reply still takes more than 22 hours to reach us.',
        'In 2012 it crossed the heliopause, where the Sun\'s wind gives way to the thin gas between the stars.'
    ],
    proxima: [
        'It is a red dwarf that flares, blasting its planets with X-rays.',
        'It is the faint third member of Alpha Centauri, the nearest star system to the Sun.',
        'A world in its temperate zone, Proxima b, was found by the tiny wobble of the star.'
    ],
    'proxima-b': [
        'One face may stare at the star forever, a permanent day beside a permanent night.',
        'Flares may have stripped the air, or a magnetic field may have saved it. That question is still open.',
        'No telescope has seen the ground. The surface in front of you is imagined from what the starlight implies.'
    ],
    sirius: [
        'It is the brightest star in the night sky. Ancient Egypt timed the Nile flood by the morning it first rose.',
        'Its companion, Sirius B, is a white dwarf about the size of Earth with the mass of the Sun.',
        'A teaspoon of that companion would weigh as much as an elephant.'
    ],
    orion: [
        'The Trapezium, a handful of hot young stars, is clearing a cavity in the gas.',
        'Stars forming here are still wrapped in disks of dust, the raw material of planets.',
        'What you see is the bright edge of a much larger dark cloud stretching across the constellation.'
    ],
    horsehead: [
        'The head is a dark cloud, not an empty hole. It only shows up because brighter gas sits behind it.',
        'Infrared light gets through the dust and finds stars still forming inside the mane.',
        'It sits just south of Alnitak, the eastern star of Orion\'s belt.'
    ],
    helix: [
        'Cometary knots in the ring are dense fingers of gas pointing away from the central star.',
        'It is one of the closest planetary nebulae, which is why the eye looks so large.',
        'The white dwarf at the centre will cool for billions of years.'
    ],
    crab: [
        'The pulsar at the centre is a neutron star about the size of a city, left by the explosion of 1054.',
        'The filaments are still expanding, at roughly 1,500 kilometres a second.',
        'Chinese astronomers recorded the guest star. It was visible in daylight.'
    ],
    eagle: [
        'Hubble\'s 1995 picture made these columns famous. A later one showed the same towers in sharper light.',
        'A supernova shock has probably already reached them. Light-travel time means we still see them standing.',
        'They belong to the Eagle Nebula, a much larger star-forming region.'
    ],
    carina: [
        'The nebula spans more than 300 light-years of pillars, clusters, and dust.',
        'Eta Carinae is a pair of massive stars wrapped in the debris of its own eruption.',
        'Hubble and JWST both keep coming back. It is one of the most detailed nurseries we can see.'
    ],
    rosette: [
        'The cavity in the middle was carved by the ultraviolet light and wind of a young cluster.',
        'The cluster, NGC 2244, is only a few million years old.',
        'From a dark site the rose is wide enough to show up in binoculars.'
    ],
    ring: [
        'The ring is not a flat circle. It is a barrel of gas, and we happen to be looking down its length.',
        'The orange rim is cooler nitrogen. The blue centre is hotter oxygen.',
        'The faint star in the hole is the white dwarf the original star became.'
    ],
    catseye: [
        'Eleven or more shells surround the core, each one an older breath of the star.',
        'Fast jets punch out through the rings and twist them.',
        'It sits in Draco, far enough north that it never sets for much of the northern hemisphere.'
    ],
    lagoon: [
        'The whole cloud is about 55 light-years wide. This picture is only a few light-years of it.',
        'It was catalogued in 1654 so it would not be mistaken for a comet.',
        'The bright hourglass near the centre is gas lit by a very young, very hot star.'
    ],
    butterfly: [
        'A dark doughnut of dust around the star blocks the light and squeezes the gas into two wings.',
        'The central star is hidden. Its surface is hotter than 200,000 degrees.',
        'The wings hold dust that formed as the star died, including minerals more often found in rocks.'
    ],
    pleiades: [
        'These blue stars were born together and are still drifting apart. The cluster will not last forever.',
        'Dust in front of them scatters their light, which is why the group looks wrapped in haze.',
        'They are young, about a hundred million years old, and still hot and blue.'
    ],
    andromeda: [
        'On a dark night you can see it with no telescope, a faint smear about the width of the full Moon.',
        'It holds on the order of a trillion stars, and it is falling toward the Milky Way.',
        'The two galaxies will meet. The sky, billions of years from now, will be full of its stars.'
    ],
    'sgr-a': [
        'The dark circle is a shadow, not the hole itself: the region where light falls in and cannot climb back out.',
        'Stars have been watched whipping around this empty point for decades. That is how it was weighed.',
        'The picture on this card is the first image of that shadow, assembled from telescopes spread across Earth.'
    ],
    'asteroid-belt': [
        'Most of the belt\'s mass sits in four worlds: Ceres, Vesta, Pallas and Hygiea. Ceres has bright spots of salt.',
        'The rest is so widely scattered that spacecraft fly through without dodging rocks.',
        'Vesta carries a crater at its south pole so deep the impact nearly broke it in two.'
    ],
    'kuiper-belt': [
        'Arrokoth, visited in 2019, is two lobes that merged gently, a snapshot of how planets begin.',
        'Many of the comets that swing past the Sun started out here.',
        'Pluto is the famous resident. Haumea, Makemake and a crowd of smaller worlds share the belt.'
    ],
    'oort-cloud': [
        'Nobody has seen the cloud itself. We only see the comets it lets go.',
        'A passing star can nudge one loose, and it falls inward for the first time in millions of years.',
        'This is the outer reach of the Sun\'s gravity, a sphere of ice far beyond the planets.'
    ],
    io: [
        'Lava lakes overturn and sulfur snows back down. Craters do not get the chance to grow old.',
        'Jupiter\'s tides flex the moon every orbit, and that flexing is what keeps the interior molten.'
    ],
    europa: [
        'Long cracks lace the ice, stained where the ocean may have welled up from below.',
        'Plumes of water vapor have been hinted at above the surface. A hidden sea is the leading explanation.'
    ],
    ganymede: [
        'It is bigger than Mercury, and it is the only moon with its own magnetic field.',
        'Under the grooved ice there is likely another ocean, buried deeper than Europa\'s.'
    ],
    callisto: [
        'The surface is so old that new craters land on top of old ones, a fossil of the early solar system.',
        'It sits outside Jupiter\'s worst radiation, which is why mission planners keep looking at it as a place to orbit.'
    ],
    mimas: [
        'The crater Herschel is a third as wide as the moon itself. The impact nearly shattered it.',
        'From a distance the round scar makes Mimas look a little like the Death Star.'
    ],
    enceladus: [
        'Tiger stripes at the south pole vent the ocean into space as geysers of ice.',
        'Cassini flew through the spray and found salt, and chemistry that biologists pay attention to.'
    ],
    tethys: [
        'A canyon called Ithaca Chasma runs most of the way around the moon, as if it cracked while it froze.',
        'The crater Odysseus is so large the moon must have been soft, or partly molten, when it formed.'
    ],
    dione: [
        'The bright wisps on the trailing side are ice cliffs, places where the crust pulled apart.',
        'Two tiny moons share its orbit, one leading and one following, parked in the same path.'
    ],
    rhea: [
        'It is a quiet ice moon, heavily cratered, with little sign that anything has resurfaced it.',
        'Cassini hunted for a thin ring of debris around it. The question was never quite settled.'
    ],
    titan: [
        'Methane falls as rain, gathers in lakes, and blows into dunes of hydrocarbon sand.',
        'Huygens landed here in 2005, the farthest touchdown ever made, under an orange sky.'
    ],
    iapetus: [
        'One face is as dark as coal and the other as bright as snow. Dust swept up along the orbit paints the leading side.',
        'A mountain ridge runs the equator like a seam, and nobody is sure how it was built.'
    ],
    miranda: [
        'The surface looks shattered and reassembled: patchwork regions called coronae sit beside old craters.',
        'Cliffs here are among the tallest known, tall enough that a rock thrown from the top would take minutes to fall.'
    ],
    ariel: [
        'Long valleys cut the ice, and smoother plains suggest something flowed and froze again.',
        'Of Uranus\'s large moons, Ariel looks the most recently awake.'
    ],
    titania: [
        'It is Uranus\'s largest moon. Huge canyons cut across craters, so the crust moved after the impacts.',
        'Like several of the ice moons, it may hide a deep ocean under the frozen crust.'
    ],
    oberon: [
        'The outermost big moon of Uranus is dark and cratered, a cold record of ancient impacts.',
        'One crater holds a mountain that may be the leftover peak of the impact that made it.'
    ],
    triton: [
        'It orbits Neptune backwards, a sign it was captured rather than born here.',
        'Nitrogen geysers dust the pink ice, and a cantaloupe-like terrain covers part of the surface.'
    ]
};

const proseBeats = (record) => {
    if (!record || !record.info) {
        return [];
    }
    const chunks = record.info.split('|').map((chunk) => (
        chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    )).filter((chunk) => chunk.length > 40 && !/more info here/i.test(chunk));
    const sentences = [];
    chunks.forEach((chunk, chunkIndex) => {
        const parts = chunk.match(/[^.!?]+[.!?]+/g) || [];
        parts.forEach((sentence, sentenceIndex) => {
            if (chunkIndex === 0 && sentenceIndex === 0) {
                return;
            }
            const clean = sentence.trim();
            if (clean.length > 50 && clean.length < 240) {
                sentences.push(clean);
            }
        });
    });
    return sentences.slice(0, 3);
};

export const createWelcomeSection = ({ onTour, onFree } = {}) => {
    const parentDiv = document.getElementById('body');
    if (document.getElementById('welcome-div')) {
        return;
    }
    const backgroundDiv = document.createElement('div');
    backgroundDiv.id = 'background-div';

    const contentDiv = document.createElement('div');
    contentDiv.id = 'welcome-div';
    contentDiv.innerHTML = `
        <p class="welcome-kicker">A sky full of worlds</p>
        <h1>Explore the Milky Way</h1>
        <p class="info-p-text">Take a guided pass from the Sun out past Pluto, then on to the nearest stars and Andromeda. Each stop turns so you can look around, and the card tells you something wonderful.</p>
        <div class="welcome-actions">
            <button type="button" id="welcome-tour-button">Start the guided tour</button>
            <button type="button" id="welcome-free-button">Free explore</button>
        </div>
    `;

    const dismiss = () => {
        document.body.classList.remove('awaiting-choice');
        contentDiv.remove();
        backgroundDiv.remove();
    };
    document.body.classList.add('awaiting-choice');
    contentDiv.querySelector('#welcome-tour-button').addEventListener('click', () => {
        dismiss();
        if (onTour) onTour();
    });
    contentDiv.querySelector('#welcome-free-button').addEventListener('click', () => {
        dismiss();
        if (onFree) onFree();
    });
    parentDiv.appendChild(backgroundDiv);
    parentDiv.appendChild(contentDiv);
};

export const showObjectCard = (mesh, allInfo, handlers = {}) => {
    const existing = document.getElementById('object-card');
    if (existing) {
        existing.remove();
    }
    if (!mesh) {
        if (handlers.onClose) handlers.onClose();
        return;
    }
    const record = allInfo[mesh.infoId];
    const title = (record && record.title) || mesh.planetName || 'Object';
    const blurb = record && record.info ? firstSentence(record.info.split('|')[0]) : '';
    const notes = NOTES[String(mesh.infoId)] || proseBeats(record);
    const more = record ? wikiLink(record.info) : null;
    const photo = mesh.posterTexture ? String(mesh.posterTexture).replace(/^\//, '') : '';
    const wonder = WONDERS[String(mesh.infoId)] || '';

    const card = document.createElement('div');
    card.id = 'object-card';
    if (handlers.arrived) {
        card.classList.add('arriving');
    }
    card.innerHTML = `
        <button type="button" class="close" id="card-close"></button>
        ${handlers.arrived ? '<p class="card-kicker">Arrived</p>' : ''}
        ${photo ? `<img class="card-photo${mesh.posterFit === 'contain' ? ' is-square' : ''}" alt="${title}" src="${photo}">` : ''}
        ${mesh.posterCredit ? `<p class="card-photo-credit">${mesh.posterCredit}</p>` : ''}
        <h2>${title}</h2>
        <p class="card-distance"></p>
        ${wonder ? `<p class="card-wonder"><span>Wonder</span>${wonder}</p>` : (blurb ? `<p class="card-blurb">${blurb}</p>` : '')}
        ${mesh.surfaceImagined ? '<p class="card-note">No spacecraft has photographed this world. The surface is imagined from what astronomers know.</p>' : ''}
        ${mesh.surfacePartial ? '<p class="card-note">New Horizons photographed the heart side. The far side of this globe is filled in from that visit, and the Sun casts the shadow.</p>' : ''}
        ${notes.length ? `<ul class="card-notes">${notes.map((note) => `<li>${note}</li>`).join('')}</ul>` : ''}
        <div class="card-actions">
            <button type="button" id="card-look">Look at</button>
            <button type="button" id="card-warp">Warp here</button>
            ${mesh.canLookThrough ? '<button type="button" id="card-eyepiece">Take a look</button>' : ''}
            ${more ? `<a href="${more}" target="_blank" rel="noopener">More info</a>` : ''}
        </div>
    `;
    document.getElementById('body').appendChild(card);
    card.querySelector('.card-distance').textContent = formatRealDistance(mesh);
    card.querySelector('#card-close').addEventListener('click', (event) => {
        event.stopPropagation();
        card.remove();
        if (handlers.onClose) handlers.onClose();
    });
    card.querySelector('#card-look').addEventListener('click', (event) => {
        event.stopPropagation();
        if (handlers.lookAt) handlers.lookAt(mesh);
    });
    card.querySelector('#card-warp').addEventListener('click', (event) => {
        event.stopPropagation();
        if (handlers.warpTo) handlers.warpTo(mesh);
    });
    const eyepiece = card.querySelector('#card-eyepiece');
    if (eyepiece) {
        eyepiece.addEventListener('click', (event) => {
            event.stopPropagation();
            if (handlers.lookThrough) handlers.lookThrough(mesh);
        });
    }
};

export const closeObjectCard = () => {
    const existing = document.getElementById('object-card');
    if (existing) {
        existing.remove();
    }
};

export const deleteLoadingScreen = () => {
    const element = document.getElementById('loading-screen');
    if (!element) {
        return;
    }
    const started = window.__milkyLoadStart || Date.now();
    const wait = Math.max(0, 2600 - (Date.now() - started));
    window.setTimeout(() => {
        element.classList.add('leaving');
        window.setTimeout(() => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }, 700);
    }, wait);
};
