from flask import Flask, request, jsonify
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

app = Flask(__name__)

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

def convert_to_isl(text):
    """Convert English text to simplified ISL representation"""
    words = nltk.word_tokenize(text.lower())
    stop_words = set(stopwords.words("english"))
    lemmatizer = WordNetLemmatizer()
    
    isl_words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    isl_text = " ".join(isl_words)
    return isl_text

@app.route("/convert-to-isl", methods=["POST"])
def convert_text():
    data = request.get_json()
    text = data.get("text", "")
    isl_text = convert_to_isl(text)
    return jsonify({"isl_text": isl_text})

if __name__ == "__main__":
    app.run(debug=True)
