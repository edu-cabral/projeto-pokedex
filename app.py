import os

from dotenv import load_dotenv
from database import relato_post, relato_get, senha_admin_correta
from flask import Flask, render_template, request, redirect, session, url_for

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('index.html')

@app.route('/pokemon/<string:name>')
def pokemon(name):
    return render_template('pkmn.html', name=name.lower())

@app.route('/info')
def info():
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

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    erro = None

    if request.method == "POST":
        if senha_admin_correta(request.form.get("senha", "")):
            session.clear()
            session["admin"] = True
            return redirect(url_for("admin"))
        erro = "Senha incorreta."

    if not session.get("admin"):
        return render_template("admin_login.html", erro=erro)

    return render_template('admin.html', relatos=relato_get())

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for("home"))

if __name__ == '__main__':
    print("Aplicação rodando")
    app.run(host='0.0.0.0')