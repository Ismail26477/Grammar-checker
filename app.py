from flask import Flask, render_template, request, jsonify
from deepmultilingualpunctuation import PunctuationModel
from transformers import pipeline
from happytransformer import HappyTextToText, TTSettings

app = Flask(__name__)

# Initialize models
punctuation_model = PunctuationModel()
fix_spelling = pipeline("text2text-generation", model="oliverguhr/spelling-correction-english-base")
happy_tt = HappyTextToText("T5", "vennify/t5-base-grammar-correction")
grammar_settings = TTSettings(num_beams=5, min_length=1)

@app.route('/')
def index(): 
    return render_template('index.html')
@app.route('/correct', methods=['POST'])
def correct():
    text = request.form['text']
    
    # Punctuation correction
    punctuated_text = punctuation_model.restore_punctuation(text)
    
    # Handle long text by splitting it into manageable chunks
    def chunk_text(text, max_length=1024):
        return [text[i:i+max_length] for i in range(0, len(text), max_length)]
    
    # Spelling correction
    corrected_spelling_chunks = []
    for chunk in chunk_text(punctuated_text):
        corrected_spelling_chunks.append(fix_spelling(chunk, max_length=2048)[0]['generated_text'])
    spelling_result = ' '.join(corrected_spelling_chunks)
    
    # Grammar correction
    corrected_grammar_chunks = []
    for chunk in chunk_text(spelling_result):
        corrected_grammar_chunks.append(happy_tt.generate_text(f"grammar: {chunk}", args=grammar_settings).text)
    grammar_result = ' '.join(corrected_grammar_chunks)
    
    # Create detailed output showing before, error -> correction, and after words
    original_words = text.split()
    punctuated_words = punctuated_text.split()
    corrected_words = grammar_result.split()

    # Updated code to handle empty strings
    combined_corrections = []
        
    # Handle cases where the lengths of lists might be different
    max_length = max(len(original_words), len(punctuated_words), len(corrected_words))
        
    for i in range(max_length):
        orig = original_words[i] if i < len(original_words) else ''
        punct = punctuated_words[i] if i < len(punctuated_words) else ''
        corr = corrected_words[i] if i < len(corrected_words) else ''
            
        if orig != corr:
            # Determine the type of correction
            correction_type = 'grammar'
            if orig and corr and orig.lower() != corr.lower():
                correction_type = 'spell'
            elif orig and corr and orig[0].islower() and corr[0].isupper():
                correction_type = 'capitalize'
                
            combined_corrections.append({
                'index': i,
                'before': original_words[i-1] if i > 0 else '',
                'error': orig,
                'correction': corr,
                'after': original_words[i+1] if i < len(original_words) - 1 else '',
                'type': correction_type
            })

    
    return jsonify({'combined_corrections': combined_corrections, 'corrected_text': grammar_result})

if __name__ == "__main__":
    app.run(debug=True)
