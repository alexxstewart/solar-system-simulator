const H = 'style/textures/observatory/hubble';
const J = 'style/textures/observatory/jwst';
const G = 'style/textures/galaxy';

const hubble = [
    {
        id: 'pillars',
        year: '1995',
        label: '1995 Pillars',
        title: 'Pillars of Creation',
        note: 'Columns of gas several light-years tall, with new stars forming inside. This is the picture that made Hubble famous.',
        image: `${G}/pillars.jpg`,
        tint: [110, 176, 220]
    },
    {
        id: 'deep-field',
        year: '1995',
        label: '1995 Deep Field',
        title: 'Hubble Deep Field',
        note: 'Ten days on a nearly blank patch of sky. It was full of galaxies, most of them never seen before.',
        image: `${H}/deep-field.jpg`,
        tint: [186, 170, 140]
    },
    {
        id: 'sombrero',
        year: '2003',
        label: '2003 Sombrero',
        title: 'Sombrero Galaxy',
        note: 'A spiral seen almost edge-on. The dark lane is dust, and the bright core is a swarm of old stars around a giant black hole.',
        image: `${H}/sombrero.jpg`,
        tint: [210, 186, 140]
    },
    {
        id: 'catseye',
        year: '2004',
        label: '2004 Cat’s Eye',
        title: 'Cat’s Eye Nebula',
        note: 'A dying star shed its atmosphere in pulses, about a thousand years apart. The rings are those pulses, stacked.',
        image: `${G}/catseye.jpg`,
        tint: [230, 72, 96]
    },
    {
        id: 'helix',
        year: '2004',
        label: '2004 Helix',
        title: 'Helix Nebula',
        note: 'The nearest planetary nebula, and a preview of the Sun’s ending: outer layers blown off around a white dwarf.',
        image: `${G}/helix.jpg`,
        tint: [120, 176, 232]
    },
    {
        id: 'crab',
        year: '2005',
        label: '2005 Crab',
        title: 'Crab Nebula',
        note: 'In 1054 people watched a star explode. These filaments are the wreckage, still expanding around a pulsar.',
        image: `${G}/crab.jpg`,
        tint: [150, 214, 186]
    },
    {
        id: 'orion',
        year: '2006',
        label: '2006 Orion',
        title: 'Orion Nebula',
        note: 'The nearest great stellar nursery. New stars are switching on in the glow, about 1,300 light-years away.',
        image: `${G}/orion.jpg`,
        tint: [232, 150, 186]
    },
    {
        id: 'antennae',
        year: '2006',
        label: '2006 Antennae',
        title: 'Antennae Galaxies',
        note: 'Two galaxies tearing through each other. The long streams are stars flung out by the collision.',
        image: `${H}/antennae.jpg`,
        tint: [186, 210, 170]
    },
    {
        id: 'carina',
        year: '2007',
        label: '2007 Carina',
        title: 'Carina Nebula',
        note: 'A vast star-forming cloud. Eta Carinae, buried in it, erupted in the 1840s and is still not finished.',
        image: `${G}/carina.jpg`,
        tint: [232, 164, 110]
    },
    {
        id: 'butterfly',
        year: '2009',
        label: '2009 Butterfly',
        title: 'Butterfly Nebula',
        note: 'Gas thrown off by a dying star so hot it shines mostly in ultraviolet. A dusty ring pinches the outflow into two wings.',
        image: `${G}/butterfly.jpg`,
        tint: [220, 150, 190]
    },
    {
        id: 'saturn',
        year: '2009',
        label: '2009 Saturn',
        title: 'Saturn at Equinox',
        note: 'The rings were edge-on to the Sun, so they almost vanished, and the moons threw long shadows across the ice.',
        image: `${H}/saturn-equinox.jpg`,
        tint: [214, 196, 150]
    },
    {
        id: 'rosette',
        year: '2010',
        label: '2010 Rosette',
        title: 'Rosette Nebula',
        note: 'Young stars have blown a hole through the middle of this cloud. The rim still looks like the petals of a rose.',
        image: `${G}/rosette.jpg`,
        tint: [220, 112, 124]
    },
    {
        id: 'horsehead',
        year: '2013',
        label: '2013 Horsehead',
        title: 'Horsehead Nebula',
        note: 'A dark cloud of dust standing in front of glowing hydrogen. The silhouette is a horse’s head.',
        image: `${G}/horsehead.jpg`,
        tint: [214, 86, 92]
    },
    {
        id: 'ring',
        year: '2013',
        label: '2013 Ring',
        title: 'Ring Nebula',
        note: 'A dying star’s atmosphere, seen looking down the barrel of the shell it left behind.',
        image: `${G}/ring.jpg`,
        tint: [240, 148, 86]
    },
    {
        id: 'jupiter',
        year: '2014',
        label: '2014 Jupiter',
        title: 'Jupiter’s Shrinking Spot',
        note: 'The Great Red Spot, a storm older than telescopes, had shrunk to the smallest size ever measured.',
        image: `${H}/jupiter-grs.jpg`,
        tint: [196, 154, 110]
    },
    {
        id: 'hudf',
        year: '2014',
        label: '2014 Ultra Deep',
        title: 'Ultra Deep Field',
        note: 'The deepest picture Hubble had made, begun in 2004 and extended here into ultraviolet. Almost every speck is a galaxy.',
        image: `${H}/hudf.jpg`,
        tint: [170, 150, 210]
    },
    {
        id: 'andromeda',
        year: '2015',
        label: '2015 Andromeda',
        title: 'Andromeda Galaxy',
        note: 'The nearest large galaxy, about a trillion stars. Hubble’s mosaic resolves stars in its disk one by one.',
        image: `${G}/andromeda.jpg`,
        tint: [170, 190, 230]
    },
    {
        id: 'lagoon',
        year: '2018',
        label: '2018 Lagoon',
        title: 'Lagoon Nebula',
        note: 'A star-forming cloud split by a dark lane of dust, which is why it was named for a lagoon.',
        image: `${G}/lagoon.jpg`,
        tint: [120, 186, 210]
    }
];

const jwst = [
    {
        id: 'smacs',
        year: '2022',
        label: '2022 First light',
        title: 'Webb’s First Deep Field',
        note: 'The first full-color picture. A cluster’s gravity bends much older galaxies into arcs around it.',
        image: `${J}/smacs0723.jpg`,
        tint: [186, 140, 210]
    },
    {
        id: 'cliffs',
        year: '2022',
        label: '2022 Cliffs',
        title: 'Cosmic Cliffs',
        note: 'The edge of a cavity in the Carina Nebula, carved by young stars. Infrared cuts through the dust that hides them.',
        image: `${J}/cosmic-cliffs.jpg`,
        tint: [120, 170, 220]
    },
    {
        id: 'southern-ring',
        year: '2022',
        label: '2022 Southern Ring',
        title: 'Southern Ring Nebula',
        note: 'A dying star, and a second star that helped shape the shells. The dust glows where visible light barely reaches.',
        image: `${J}/southern-ring.jpg`,
        tint: [220, 150, 120]
    },
    {
        id: 'stephans',
        year: '2022',
        label: '2022 Quintet',
        title: 'Stephan’s Quintet',
        note: 'Four galaxies colliding, with a fifth in the foreground. The shocks in the gas show up bright in the infrared.',
        image: `${J}/stephans.jpg`,
        tint: [200, 160, 130]
    },
    {
        id: 'cartwheel',
        year: '2022',
        label: '2022 Cartwheel',
        title: 'Cartwheel Galaxy',
        note: 'A smaller galaxy punched through this one. The ring is a wave of new stars still spreading outward.',
        image: `${J}/cartwheel.jpg`,
        tint: [196, 140, 170]
    },
    {
        id: 'tarantula',
        year: '2022',
        label: '2022 Tarantula',
        title: 'Tarantula Nebula',
        note: 'The busiest star factory in the nearby universe, in the Large Magellanic Cloud. Webb sees the young stars inside the dust.',
        image: `${J}/tarantula.jpg`,
        tint: [210, 140, 90]
    },
    {
        id: 'jwst-pillars',
        year: '2022',
        label: '2022 Pillars',
        title: 'Pillars of Creation',
        note: 'The same towers Hubble made famous, now in infrared. Stars still buried in the gas show through.',
        image: `${J}/pillars.jpg`,
        tint: [140, 120, 200]
    },
    {
        id: 'rho',
        year: '2023',
        label: '2023 Rho Ophiuchi',
        title: 'Rho Ophiuchi',
        note: 'The closest star-forming cloud. Jets from newborn stars punch out through the dust.',
        image: `${J}/rho.jpg`,
        tint: [200, 120, 90]
    },
    {
        id: 'casa',
        year: '2023',
        label: '2023 Cassiopeia A',
        title: 'Cassiopeia A',
        note: 'The wreckage of a star that exploded about 340 years ago. Infrared picks out the layers the blast threw off.',
        image: `${J}/cas-a.jpg`,
        tint: [220, 120, 100]
    },
    {
        id: 'phantom',
        year: '2024',
        label: '2024 Phantom',
        title: 'Phantom Galaxy',
        note: 'A spiral seen face-on. The dust lanes and the bright knots are where the next generation of stars is gathering.',
        image: `${J}/phantom.jpg`,
        tint: [180, 150, 210]
    },
    {
        id: 'future-dawn',
        year: 'Ahead',
        label: 'Ahead · First galaxies',
        title: 'The first galaxies',
        future: true,
        note: 'Webb is still pushing past that first deep field, toward the galaxies that ended the cosmic dark ages.',
        body: 'Some candidates from the first few hundred million years are already in hand. The work ahead is to confirm which ones truly formed first, and how their light cleared the fog that filled the young universe.',
        tint: [170, 150, 220]
    },
    {
        id: 'future-worlds',
        year: 'Ahead',
        label: 'Ahead · Rocky air',
        title: 'Air around rocky worlds',
        future: true,
        note: 'Webb has already tasted the atmospheres of giant planets. The harder prize is a small world that might hold water.',
        body: 'Hot gas giants were the first atmospheres it could read. Next is the air of rocky planets in the temperate zone of nearby cool stars: water, carbon dioxide, and anything that would say the surface is not bare rock.',
        tint: [140, 190, 210]
    },
    {
        id: 'future-disks',
        year: 'Ahead',
        label: 'Ahead · Planet birth',
        title: 'How planets are born',
        future: true,
        note: 'Disks of dust around young stars already show gaps where planets may be gathering. Webb is reading their chemistry.',
        body: 'The rings and gaps are only the outline. The coming maps are of water, carbon, and the other ingredients inside those disks, and of how much of that material ends up in the rocky planets.',
        tint: [200, 160, 120]
    }
];

const withKicker = (kicker, items) => items.map((item) => ({ ...item, kicker: `${kicker} · ${item.year}` }));

export const GALLERIES = {
    hubble: { id: 'hubble', kicker: 'Hubble', items: withKicker('Hubble', hubble) },
    jwst: { id: 'jwst', kicker: 'James Webb', items: withKicker('James Webb', jwst) }
};

const NEBULA_SLIDE = {
    eagle: 'pillars',
    orion: 'orion',
    horsehead: 'horsehead',
    rosette: 'rosette',
    crab: 'crab',
    helix: 'helix',
    ring: 'ring',
    catseye: 'catseye',
    lagoon: 'lagoon',
    carina: 'carina',
    butterfly: 'butterfly'
};

export const galleryFor = (id) => GALLERIES[id] || null;

export const slideForNebula = (infoId) => NEBULA_SLIDE[infoId] || null;

export const allSlides = () => GALLERIES.hubble.items.concat(GALLERIES.jwst.items);
