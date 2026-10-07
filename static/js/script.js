document.addEventListener('DOMContentLoaded', () => {
    fetch('/static/data/dex.json')
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('list');
            list.innerHTML = data.pokemon_entries.map(createPokeLine).join('');
        })
        .catch(error => console.error('Erro ao carregar o JSON', error));
});

function createPokeLine(entry) {
    const number = String(entry.entry_number).padStart(3, '0');
    const { name, type } = entry.pokemon_species;

    const types = type
        .map(t => `<img src="static/icons/type-icons/${t}.svg" alt="${t}">`)
        .join('');

    return `
        <a class="poke-line" id="${entry.entry_number}" href="/pokemon/${toSlug(name)}">
            <span class="poke-number">${number}</span>
            <img src="static/icons/poke-icons/${entry.entry_number}.png" alt="${name}" class="poke-img">
            <span class="poke-name">${name}</span>
            <span class="poke-type">${types}</span>
        </a>`;
}

const btnEnvio = document.getElementById('enviar');
const descricao = document.getElementById('descricao');

btnEnvio.addEventListener('click', function() {

    if (descricao.value.trim() === '') {
        alert('Erro, relato não contêm conteúdo.');
        return;
    }

    alert('Obrigado pela sua contribuição!');

    descricao.value = '';
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