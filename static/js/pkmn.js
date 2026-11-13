const API_URL = 'https://pokeapi.co/api/v2';

// Sprites hospedados no repositório oficial da PokéAPI (nada para baixar ou manter localmente)
const SPRITES_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const getSpriteUrl = (id, shiny = false) => `${SPRITES_URL}/${shiny ? 'shiny/' : ''}${id}.png`;

document.addEventListener('DOMContentLoaded', fetchPokemonDetail);

// ---------------------------------------------------------------------------
// Nomes
// ---------------------------------------------------------------------------

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

// "swords-dance" -> "Swords Dance"
function capitalizeSlug(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// "tapu-koko" -> "Tapu Koko" | "mr-mime" -> "Mr. Mime"
// Use só para exibir: links e ícones continuam usando o nome original (slug)
function formatName(slug) {
    return SPECIAL_NAMES[slug] ?? capitalizeSlug(slug);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function renderBaseStats(stats) {
    const statContainer = document.getElementById('stat-container');

    // Mapeia os nomes técnicos da API pra nomes em PT-BR
    const statNames = {
        'hp': 'HP',
        'attack': 'Ataque',
        'defense': 'Defesa',
        'special-attack': 'Atq. Especial',
        'special-defense': 'Def. Especial',
        'speed': 'Velocidade'
    };

    statContainer.innerHTML = stats.map(s => {
        let bgcolor = "";
        const label = statNames[s.stat.name] || s.stat.name;
        const value = s.base_stat;
        if (value <= 29) {
            bgcolor = "#f34444"
        } else if (value >= 30 && value <= 59) {
            bgcolor = "#ff7f0f"
        } else if (value >= 60 && value <= 89) {
            bgcolor = "#ffdd57"
        } else if (value >= 90 && value <= 119) {
            bgcolor = "#a0e515"
        } else if (value >= 120 && value <= 149) {
            bgcolor = "#23cd5e"
        } else if (value >= 150) {
            bgcolor = "#00c2b8"
        }
        // Base stats geralmente vão de 1 a ~255; usamos 255 como teto pra barra
        const percent = Math.min((value / 255) * 100, 100);

        return `
            <div class="stat-row">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${value}</span>
                <div class="progress stat-bar-bg">
                    <div class=" progress-bar stat-bar-fill" style="width: ${percent}%; background-color: ${bgcolor}"></div>
                </div>
            </div>`;
    }).join('');
}

// ---------------------------------------------------------------------------
// Dados e formas
// ---------------------------------------------------------------------------

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ${res.status} ao buscar ${url}`);
    return res.json();
}

// Cache simples: cada forma só é baixada uma vez
const pokemonCache = new Map();

async function fetchPokemon(url) {
    if (!pokemonCache.has(url)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao buscar o Pokémon');
        pokemonCache.set(url, await res.json());
    }
    return pokemonCache.get(url);
}

function renderTypeIcons(pokemonData) {
    return pokemonData.types
        .sort((a, b) => a.slot - b.slot)
        .map(t => `<img src="/static/icons/type-icons/${t.type.name}.svg" alt="${t.type.name}">`)
        .join('');
}

// Palavras que aparecem no nome das formas -> texto exibido
const FORM_WORDS = {
    'mega': 'Mega',
    'gmax': 'Gigantamax',
    'alola': 'Alola',
    'galar': 'Galar',
    'hisui': 'Hisui',
    'paldea': 'Paldea',
    'primal': 'Primal',
    'totem': 'Totem'
};

// "charizard-mega-x" (espécie "charizard") -> "mega-x"; forma padrão -> ""
function getFormSuffix(variety, speciesName) {
    if (variety.is_default) return '';

    const prefix = `${speciesName}-`;
    const fullName = variety.pokemon.name;
    return fullName.startsWith(prefix) ? fullName.slice(prefix.length) : fullName;
}

// "mega-x" -> "Mega X"
function getFormLabel(variety, speciesName) {
    if (variety.is_default) return 'Padrão';

    return getFormSuffix(variety, speciesName)
        .split('-')
        .map(word => FORM_WORDS[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ---------------------------------------------------------------------------
// Texto da Pokédex por forma
// ---------------------------------------------------------------------------

// A PokéAPI guarda os textos por ESPÉCIE e por jogo, não por forma. Para aproximar o texto de
// cada forma, usamos o jogo em que ela estreou (ex.: forma de Galar -> Sword/Shield).
const FORM_VERSIONS = {
    'mega': ['x', 'y', 'omega-ruby', 'alpha-sapphire'],
    'primal': ['omega-ruby', 'alpha-sapphire'],
    'alola': ['ultra-sun', 'ultra-moon', 'sun', 'moon'],
    'galar': ['sword', 'shield'],
    'gmax': ['sword', 'shield'],
    'hisui': ['legends-arceus'],
    'paldea': ['scarlet', 'violet']
};

function getFlavorText(speciesData, variety) {
    const english = speciesData.flavor_text_entries.filter(e => e.language.name === 'en');

    const preferredVersions = getFormSuffix(variety, speciesData.name)
        .split('-')
        .flatMap(word => FORM_VERSIONS[word] ?? []);

    // 1) jogo de estreia da forma; 2) Yellow (só existe até o nº 151); 3) entrada mais recente
    const entry =
        preferredVersions.map(v => english.find(e => e.version.name === v)).find(Boolean)
        ?? english.find(e => e.version.name === 'yellow')
        ?? english.at(-1);

    return entry
        ? entry.flavor_text.replace(/[\n\f]/g, ' ')
        : "Descrição indisponível.";
}

// ---------------------------------------------------------------------------
// Movepool
// ---------------------------------------------------------------------------

const TYPE_NAMES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

const MOVE_TYPES_CACHE_KEY = 'pokedex-move-types-v1';
let moveTypesPromise = null;

// Monta { 'flamethrower': 'fire', 'scratch': 'normal', ... } para TODOS os golpes.
// Em vez de uma requisição por golpe (/move/{nome}), usa as 18 requisições de tipo, que já
// listam os golpes de cada tipo. O resultado fica no localStorage para não repetir isso
// a cada página. Se algo falhar, devolve {} e o movepool aparece só sem os ícones.
function loadMoveTypes() {
    moveTypesPromise ??= (async () => {
        try {
            const cached = localStorage.getItem(MOVE_TYPES_CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch { /* localStorage indisponível: segue sem cache */ }

        try {
            const types = await Promise.all(
                TYPE_NAMES.map(name => fetchJson(`${API_URL}/type/${name}`))
            );

            const moveTypes = {};
            types.forEach(type =>
                type.moves.forEach(move => { moveTypes[move.name] = type.name; }));

            try {
                localStorage.setItem(MOVE_TYPES_CACHE_KEY, JSON.stringify(moveTypes));
            } catch { /* sem cache, tudo bem */ }

            return moveTypes;
        } catch (error) {
            console.error("Erro ao carregar os tipos dos golpes:", error);
            return {};
        }
    })();

    return moveTypesPromise;
}

function renderMoveType(type) {
    return type
        ? ` <img class="move-type" src="/static/icons/type-icons/${type}.svg" alt="${type}" title="${capitalizeSlug(type)}" height="16">`
        : '';
}

const METHOD_LABELS = {
    'level-up': 'Level up',
    'machine': 'TM / HM',
    'egg': 'Egg moves',
    'tutor': 'Tutor'
};
const METHOD_ORDER = ['level-up', 'machine', 'egg', 'tutor'];

// Jogos (version groups) do mais recente para o mais antigo: o primeiro que o Pokémon
// tiver vira o padrão do seletor. Jogos que não estiverem aqui vão para o fim da lista.
const PREFERRED_VERSION_GROUPS = [
    'scarlet-violet', 'legends-arceus', 'brilliant-diamond-and-shining-pearl', 'sword-shield',
    'ultra-sun-ultra-moon', 'sun-moon', 'omega-ruby-alpha-sapphire', 'x-y',
    'black-2-white-2', 'black-white', 'heartgold-soulsilver', 'platinum', 'diamond-pearl',
    'emerald', 'firered-leafgreen', 'ruby-sapphire', 'crystal', 'gold-silver', 'yellow', 'red-blue'
];

// Jogos em que esse Pokémon tem golpes registrados, do mais recente para o mais antigo
function getVersionGroups(pokemonData) {
    const found = new Set();
    pokemonData.moves.forEach(({ version_group_details }) =>
        version_group_details.forEach(d => found.add(d.version_group.name)));

    const rank = g => {
        const i = PREFERRED_VERSION_GROUPS.indexOf(g);
        return i === -1 ? Infinity : i;
    };
    return [...found].sort((a, b) => rank(a) - rank(b));
}

// -> { 'level-up': [{ name, level }], 'machine': [...], ... } para um jogo
function groupMoves(pokemonData, versionGroup) {
    const byMethod = {};

    pokemonData.moves.forEach(({ move, version_group_details }) => {
        version_group_details
            .filter(d => d.version_group.name === versionGroup)
            .forEach(d => {
                const method = d.move_learn_method.name;
                (byMethod[method] ??= []).push({ name: move.name, level: d.level_learned_at });
            });
    });

    Object.entries(byMethod).forEach(([method, list]) => {
        list.sort((a, b) =>
            method === 'level-up'
                ? a.level - b.level || a.name.localeCompare(b.name)
                : a.name.localeCompare(b.name));
    });

    return byMethod;
}

// Desenha o movepool em `box` e devolve o jogo que ficou selecionado.
// Algumas formas (como as Mega) podem vir sem golpes na API: nesse caso usa a forma padrão.
function renderMoves(box, data, fallbackData, selectedGroup, moveTypes = {}) {
    const usingFallback = data.moves.length === 0 && fallbackData !== data;
    const source = usingFallback ? fallbackData : data;

    const groups = getVersionGroups(source);
    if (groups.length === 0) {
        box.innerHTML = '<p class="moves-note">Sem golpes registrados para este Pokémon.</p>';
        return null;
    }

    const group = groups.includes(selectedGroup) ? selectedGroup : groups[0];
    const byMethod = groupMoves(source, group);

    const methods = [
        ...METHOD_ORDER.filter(m => byMethod[m]),
        ...Object.keys(byMethod).filter(m => !METHOD_ORDER.includes(m))
    ];

    box.innerHTML = `
        <div class="moves-header">
            <h3 class="moves-title">Movepool</h3>
            <select class="form-select form-select-sm game-select">
                ${groups.map(g => `<option value="${g}"${g === group ? ' selected' : ''}>${capitalizeSlug(g)}</option>`).join('')}
            </select>
        </div>
        ${usingFallback ? '<p class="moves-note">Esta forma não tem golpes próprios na API; mostrando os da forma padrão.</p>' : ''}
        ${methods.map(method => `
            <details class="moves-method"${method === 'level-up' ? ' open' : ''}>
                <summary>${METHOD_LABELS[method] ?? capitalizeSlug(method)} (${byMethod[method].length})</summary>
                <ul class="move-list">
                    ${byMethod[method].map(m => `<li>${method === 'level-up'
                        ? `<span class="move-level">${m.level === 0 ? 'Evo' : `Lv ${m.level}`}</span> `
                        : ''}${capitalizeSlug(m.name)}${renderMoveType(moveTypes[m.name])}</li>`).join('')}
                </ul>
            </details>`).join('')}
    `;

    return group;
}

// Usa o container #moves-container se existir no HTML; senão cria um logo abaixo dos stats
function getMovesContainer() {
    let box = document.getElementById('moves-container');
    if (!box) {
        box = document.createElement('div');
        box.id = 'moves-container';
        document.getElementById('stat-container').insertAdjacentElement('afterend', box);
    }
    return box;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

async function fetchPokemonDetail() {
    const container = document.getElementById('dex-container');
    const loadingDiv = document.getElementById('loading');

    const poke_name = pkmn_name.replace(/[^a-z0-9]+/g, '-');

    if (!poke_name) {
        loadingDiv.innerText = "Nome não informado na URL.";
        return;
    }

    // Começa já a carregar os tipos dos golpes, em paralelo com o resto
    const moveTypesPromise = loadMoveTypes();

    try {
        // 1) Espécie: traz id, nome, textos de descrição e a lista de formas (varieties)
        const speciesRes = await fetch(`${API_URL}/pokemon-species/${poke_name}/`);

        if (speciesRes.status === 404) {
            loadingDiv.innerText = "Pokémon não encontrado.";
            return;
        }
        if (!speciesRes.ok) throw new Error('Falha ao buscar a espécie');

        const speciesData = await speciesRes.json();

        const id = speciesData.id;
        const name = speciesData.name;
        const number = String(id).padStart(3, '0');

        // 2) Forma padrão: traz tipos, stats e golpes.
        // Usa a URL que a própria espécie informa, pois o nome da espécie nem sempre
        // existe em /pokemon (ex.: "deoxys" -> "deoxys-normal").
        const varieties = speciesData.varieties;
        const defaultForm = varieties.find(v => v.is_default) ?? varieties[0];
        const pokemonData = await fetchPokemon(defaultForm.pokemon.url);
        const moveTypes = await moveTypesPromise;

        loadingDiv.style.display = 'none';

        // Botões de formas: só aparecem se o Pokémon tiver mais de uma
        const formsHtml = varieties.length > 1
            ? `<div class="pokemon-forms">${varieties.map(v => `
                <button type="button"
                        class="btn btn-sm btn-outline-secondary form-btn${v === defaultForm ? ' active' : ''}"
                        data-url="${v.pokemon.url}">${getFormLabel(v, name)}</button>`).join('')}
            </div>`
            : '';

        const card = document.createElement('div');
        card.className = 'dex-card';
        card.innerHTML = `
            <img class="pokemon-image" alt="${formatName(name)}">
            <span class="pokemon-id">#${number}</span>
            <h2 class="pokemon-name">${formatName(name)}</h2>
            <span class="pokemon-type"></span>
            <button type="button" class="btn btn-sm btn-outline-warning shiny-btn">✨ Shiny</button>
            ${formsHtml}
            <p class="flavor-text"></p>
        `;

        container.appendChild(card);

        const movesBox = getMovesContainer();

        // Estado da tela
        let currentData = pokemonData;
        let currentVariety = defaultForm;
        let isShiny = false;
        let moveGroup = null;

        // Atualiza tudo que depende da forma / do shiny
        function updateView() {
            card.querySelector('.pokemon-image').src = getSpriteUrl(currentData.id, isShiny);
            card.querySelector('.pokemon-type').innerHTML = renderTypeIcons(currentData);
            card.querySelector('.flavor-text').textContent =
                `"${getFlavorText(speciesData, currentVariety)}"`;
            renderBaseStats(currentData.stats);
            moveGroup = renderMoves(movesBox, currentData, pokemonData, moveGroup, moveTypes);
        }

        updateView();

        // Shiny: alterna entre o sprite normal e o shiny (vale para a forma exibida)
        const shinyBtn = card.querySelector('.shiny-btn');
        shinyBtn.addEventListener('click', () => {
            isShiny = !isShiny;
            shinyBtn.classList.toggle('active', isShiny);
            card.querySelector('.pokemon-image').src = getSpriteUrl(currentData.id, isShiny);
        });

        // Troca de forma: baixa os dados da forma (uma vez) e atualiza a tela
        const formsBox = card.querySelector('.pokemon-forms');
        let selectedUrl = defaultForm.pokemon.url;

        if (formsBox) {
            formsBox.addEventListener('click', async event => {
                const btn = event.target.closest('.form-btn');
                if (!btn) return;

                const url = btn.dataset.url;
                selectedUrl = url;

                try {
                    const data = await fetchPokemon(url);
                    if (selectedUrl !== url) return; // o usuário já clicou em outra forma

                    currentData = data;
                    currentVariety = varieties.find(v => v.pokemon.url === url);
                    updateView();

                    formsBox.querySelectorAll('.form-btn')
                        .forEach(b => b.classList.toggle('active', b === btn));
                } catch (error) {
                    console.error("Erro ao carregar a forma:", error);
                }
            });
        }

        // Troca de jogo no movepool
        movesBox.addEventListener('change', event => {
            if (!event.target.classList.contains('game-select')) return;
            moveGroup = renderMoves(movesBox, currentData, pokemonData, event.target.value, moveTypes);
        });

    } catch (error) {
        console.error("Erro ao carregar detalhes do Pokémon:", error);
        loadingDiv.innerText = "Falha ao carregar detalhes. Tente novamente.";
    }
}