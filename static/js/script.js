const API_URL = 'https://pokeapi.co/api/v2';

// Sprites hospedados no repositório oficial da PokéAPI (nada para baixar ou manter localmente).
// Para trocar o estilo, é só mudar esta linha (veja as opções na resposta).
const SPRITES_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const getSpriteUrl = id => `${SPRITES_URL}/${id}.png`;

// Nomes que não seguem a regra "separar por hífen e capitalizar cada palavra"
const SPECIAL_NAMES = {
    'nidoran-f': 'Nidoran♀',
    'nidoran-m': 'Nidoran♂',
    'mr-mime': 'Mr. Mime',
    'mr-rime': 'Mr. Rime',
    'mime-jr': 'Mime Jr.',
    'farfetchd': "Farfetch'd",
    'sirfetchd': "Sirfetch'd",
    'flabebe': 'Flabébé',
    'type-null': 'Type: Null',
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o',
    'wo-chien': 'Wo-Chien',
    'chien-pao': 'Chien-Pao',
    'ting-lu': 'Ting-Lu',
    'chi-yu': 'Chi-Yu'
};

// "tapu-koko" -> "Tapu Koko" | "mr-mime" -> "Mr. Mime"
// Use só para exibir: links e ícones continuam usando o nome original (slug)
function formatName(slug) {
    return SPECIAL_NAMES[slug] ?? slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Os 18 tipos oficiais (mesmos nomes usados nos arquivos .svg dos ícones)
const TYPE_NAMES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('list');

    try {
        const entries = await loadEntries();
        list.innerHTML = entries.map(createPokeLine).join('');
    } catch (error) {
        console.error('Erro ao carregar os dados da PokéAPI', error);
    }
});

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ${response.status} ao buscar ${url}`);
    return response.json();
}

// "https://pokeapi.co/api/v2/pokemon/4/" -> 4
function getIdFromUrl(url) {
    return Number(url.split('/').filter(Boolean).pop());
}

// A lista de Pokémon não traz os tipos, e buscar /pokemon/{id} 1025 vezes seria pesado.
// Então buscamos os 18 tipos: cada um lista os Pokémon que o possuem e o "slot"
// (1 = tipo primário, 2 = secundário).
// Resultado: { 1: ['grass', 'poison'], 4: ['fire'], ... }
async function loadTypesById() {
    const types = await Promise.all(
        TYPE_NAMES.map(name => fetchJson(`${API_URL}/type/${name}`))
    );

    const typesById = {};

    types.forEach(type => {
        type.pokemon.forEach(({ slot, pokemon }) => {
            // Formas alternativas (id 10001+) também entram no mapa, mas nunca são consultadas
            const id = getIdFromUrl(pokemon.url);
            typesById[id] ??= [];
            typesById[id][slot - 1] = type.name;
        });
    });

    return typesById;
}

// Devolve os dados no mesmo formato que a createPokeLine já espera
async function loadEntries() {
    const [national, typesById] = await Promise.all([
        fetchJson(`${API_URL}/pokedex/national`),
        loadTypesById()
    ]);

    return national.pokemon_entries.map(({ entry_number, pokemon_species }) => ({
        entry_number,
        pokemon_species: {
            name: pokemon_species.name,
            type: typesById[entry_number] ?? []
        }
    }));
}

function createPokeLine(entry) {
    const number = String(entry.entry_number).padStart(3, '0');
    const { name, type } = entry.pokemon_species;

    const types = type
        .map(t => `<img src="static/icons/type-icons/${t}.svg" alt="${t}">`)
        .join('');

    return `
        <a class="poke-line" id="${entry.entry_number}" href="/pokemon/${toSlug(name)}">
            <span class="poke-number">${number}</span>
            <img src="${getSpriteUrl(entry.entry_number)}" alt="${formatName(name)}" class="poke-img" loading="lazy">
            <span class="poke-name">${formatName(name)}</span>
            <span class="poke-type">${types}</span>
        </a>`;
}

const menu = document.getElementById('menuLateral');
const toggle = document.querySelector('.menu-toggle');

// Sincroniza a animação do botão com o estado do menu
menu.addEventListener('show.bs.offcanvas', () => toggle.classList.add('open'));
menu.addEventListener('hide.bs.offcanvas', () => toggle.classList.remove('open'));

// Fecha o menu ao clicar em um link
menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => bootstrap.Offcanvas.getInstance(menu)?.hide());
});

document.getElementById('modalRelatar').addEventListener('show.bs.modal', () => {
    bootstrap.Offcanvas.getInstance(menu)?.hide();
});

const formRelato = document.getElementById('formRelato');
const descricao = document.getElementById('descricao');

formRelato.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (descricao.value.trim() === '') {
        alert('Erro, relato não contém conteúdo.');
        return;
    }

    try {
        const resposta = await fetch('/relato', {
            method: 'POST',
            body: new FormData(formRelato)
        });

        if (!resposta.ok) throw new Error();

        alert('Obrigado pela sua contribuição!');
        descricao.value = '';
        bootstrap.Modal.getInstance(document.getElementById('modalRelatar')).hide();
    } catch {
        alert('Não foi possível enviar o relato. Tente novamente.');
    }
});

const btnScroll = document.getElementById('scrollBack');

btnScroll.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

const pesquisa = document.getElementById('pesquisa');
const btnPesquisar = document.getElementById('btnPesquisa');

function realizarPesquisa() {
    const texto = pesquisa.value.toLowerCase().trim();

    if (texto === '') {
        return;
    }

    const cards = document.querySelectorAll('.poke-line');
    let primeiroEncontrado = null;

    cards.forEach(function (card) {
        const nome = card.querySelector('.poke-name').textContent.toLowerCase();
        const numero = card.id; // "1", "2", "25", etc.
        const numeroFormatado = numero.padStart(3, '0'); // "001", "002", "025"

        const encontrou =
            nome.includes(texto) ||
            numero === texto ||
            numeroFormatado.includes(texto);

        if (encontrou && !primeiroEncontrado) {
            primeiroEncontrado = card;
        }
    });

    if (primeiroEncontrado) {
        primeiroEncontrado.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

btnPesquisar.addEventListener('click', realizarPesquisa);

pesquisa.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        realizarPesquisa();
    }
});