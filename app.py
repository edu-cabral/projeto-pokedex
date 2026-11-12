from database import relato_post
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        relato = request.form.get('relato', '').strip()

        if relato:
            relato_post(relato)

        if not relato:
            return 'Relato vazio', 400

        if len(relato) > 5000:
            return 'Relato muito longo', 413

        if not relato_post(relato):
            return 'Erro ao salvar relato', 500

        return '', 204

    return render_template('index.html')

@app.route('/pokemon/<string:name>')
def pokemon(name):
    if request.method == 'POST':
        relato = request.form.get('relato', '').strip()

        if relato:
            relato_post(relato)

        if not relato:
            return 'Relato vazio', 400

        if len(relato) > 5000:
            return 'Relato muito longo', 413

        if not relato_post(relato):
            return 'Erro ao salvar relato', 500

        return '', 204

    return render_template('pkmn.html', name=name.lower())

@app.route('/info')
def info():
    if request.method == 'POST':
        relato = request.form.get('relato', '').strip()

        if relato:
            relato_post(relato)

        if not relato:
            return 'Relato vazio', 400

        if len(relato) > 5000:
            return 'Relato muito longo', 413

        if not relato_post(relato):
            return 'Erro ao salvar relato', 500

        return '', 204

    return render_template('info.html')

@app.route('/relato', methods=['POST'])
def relato():
    relato = request.form.get('relato', '').strip()

    if not relato:
        return 'Relato vazio', 400

    if len(relato) > 5000:
        return 'Relato muito longo', 413

    if not relato_post(relato):
        return 'Erro ao salvar relato', 500

    return '', 204

if __name__ == '__main__':
    print("Aplicação rodando")
    app.run(host='0.0.0.0')