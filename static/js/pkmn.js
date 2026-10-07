document.addEventListener('DOMContentLoaded', fetchPokemonDetail);

async function fetchBaseStats(id) {
    const statContainer = document.getElementById('stat-container');

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
        if (!res.ok) throw new Error('Falha ao buscar stats');

        const data = await res.json();

        // Mapeia os nomes técnicos da API pra nomes em PT-BR
        const statNames = {
            'hp': 'HP',
            'attack': 'Ataque',
            'defense': 'Defesa',
            'special-attack': 'Atq. Especial',
            'special-defense': 'Def. Especial',
            'speed': 'Velocidade'
        };

        statContainer.innerHTML = data.stats.map(s => {
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

    } catch (error) {
        console.error("Erro ao carregar stats:", error);
        statContainer.innerText = "Não foi possível carregar os stats.";
    }
}

async function fetchPokemonDetail() {
    const container = document.getElementById('dex-container');
    const loadingDiv = document.getElementById('loading');

    const poke_name = pkmn_name.replace(/[^a-z0-9]+/g, '-');

    if (!poke_name) {
        loadingDiv.innerText = "Nome não informado na URL.";
        return;
    }

    try {
        const localRes = await fetch('/static/data/dex.json');
        const localData = await localRes.json();

        const entry = localData.pokemon_entries.find(
            e => toSlug(e.pokemon_species.name) === toSlug(poke_name)
        );

        if (!entry) {
            loadingDiv.innerText = "Pokémon não encontrado no dex local.";
            return;
        }

        const id = entry.entry_number;

        const { name, type } = entry.pokemon_species;
        const number = String(entry.entry_number).padStart(3, '0');

        // Busca o flavor text na PokeAPI
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
        const speciesData = speciesRes.ok ? await speciesRes.json() : null;

        let cleanText = "Descrição indisponível.";
        if (speciesData) {
            const yellowEntry = speciesData.flavor_text_entries.find(
                e => e.language.name === 'en' && e.version.name === 'yellow'
            );
            if (yellowEntry) {
                cleanText = yellowEntry.flavor_text.replace(/[\n\f]/g, ' ');
            }
        }

        loadingDiv.style.display = 'none';

        const types = type
            .map(t => `<img src="/static/icons/type-icons/${t}.svg" alt="${t}">`)
            .join('');

        const card = document.createElement('div');
        card.className = 'dex-card';
        card.innerHTML = `
            <img class="pokemon-image" src="/static/icons/poke-icons/${entry.entry_number}.png" alt="${name}">
            <span class="pokemon-id">#${number}</span>
            <h2 class="pokemon-name">${name}</h2>
            <span class="pokemon-type">${types}</span>
            <p class="flavor-text">"${cleanText}"</p>
        `;

        container.appendChild(card);

        fetchBaseStats(id);

    } catch (error) {
        console.error("Erro ao carregar detalhes do Pokémon:", error);
        loadingDiv.innerText = "Falha ao carregar detalhes. Tente novamente.";
    }
}