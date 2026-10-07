from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/pokemon/<string:name>')
def pokemon(name):
    return render_template('pkmn.html', name=name.lower())

@app.route('/info')
def info():
    return render_template('info.html')

if __name__ == '__main__':
    print("Aplicação rodando")
    app.run(debug=True, host='0.0.0.0')