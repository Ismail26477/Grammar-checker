document.getElementById('text-input').addEventListener('input', function() {
    const correctionsList = document.getElementById('corrections-list');
    correctionsList.style.display = 'none';  // Hide corrections list while typing
    clearTimeout(this.timeout);  // Clear any previous timeouts

    this.timeout = setTimeout(() => {
        let text = document.getElementById('text-input').value;

        fetch('/correct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'text=' + encodeURIComponent(text)
        })
        .then(response => response.json())
        .then(data => {
            correctionsList.innerHTML = '';  // Clear previous corrections

            let allCount = 0;
            let capitalizeCount = 0;
            let spellCount = 0;
            let grammarCount = 0;

            data.combined_corrections.forEach(item => {
                const correctionLine = document.createElement('div');
                correctionLine.classList.add('correction-line');
                correctionLine.setAttribute('data-index', item.index);

                // Determine the type of correction
                const type = item.type || 'grammar';  // Default to 'grammar' if type is not specified
                correctionLine.setAttribute('data-type', type);

                const beforeText = document.createElement('span');
                beforeText.classList.add('before-text');
                beforeText.textContent = item.before ? item.before : '';

                const correctionBox = document.createElement('span');
                correctionBox.classList.add('correction-box');

                const errorWord = document.createElement('span');
                errorWord.classList.add('error-word');
                errorWord.textContent = item.error;

                const correctedWord = document.createElement('span');
                correctedWord.classList.add('corrected-word');
                correctedWord.textContent = item.correction;

                correctionBox.appendChild(errorWord);
                correctionBox.appendChild(correctedWord);

                const afterText = document.createElement('span');
                afterText.classList.add('after-text');
                afterText.textContent = item.after ? item.after : '';

                if (item.before) {
                    correctionLine.appendChild(beforeText);
                }
                correctionLine.appendChild(correctionBox);
                if (item.after) {
                    correctionLine.appendChild(afterText);
                }

                correctionsList.appendChild(correctionLine);

                // Count errors by type
                allCount++;
                if (type === 'capitalize') {
                    capitalizeCount++;
                } else if (type === 'spell') {
                    spellCount++;
                } else if (type === 'grammar') {
                    grammarCount++;
                }

                // Add click event to apply correction and update counts
                correctionLine.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    updateTextArea(index, item.correction);
                    this.remove();

                    // Update counts after correction
                    allCount--;
                    if (type === 'capitalize') {
                        capitalizeCount--;
                    } else if (type === 'spell') {
                        spellCount--;
                    } else if (type === 'grammar') {
                        grammarCount--;
                    }
                    updateCounts(allCount, capitalizeCount, spellCount, grammarCount);

                    // Re-show corrections list after making correction
                    correctionsList.style.display = 'block';
                });
            });

            // Update counts initially
            updateCounts(allCount, capitalizeCount, spellCount, grammarCount);

            // Re-show corrections list after fetching new corrections
            correctionsList.style.display = 'block';
        })
        .catch(error => console.error('Error:', error));
    }, 300);
});

// Function to update the textarea with the corrected word
function updateTextArea(index, newText) {
    const textarea = document.getElementById('text-input');
    const text = textarea.value;
    const words = text.split(/\s+/);

    if (index >= 0 && index < words.length) {
        words[index] = newText;
        textarea.value = words.join(' ');
    }
}

// Function to update the counts for "All", "Capitalize", "Spell", and "Grammar" tabs
function updateCounts(allCount, capitalizeCount, spellCount, grammarCount) {
    document.getElementById('all-count').textContent = allCount;
    document.getElementById('capitalize-count').textContent = capitalizeCount;
    document.getElementById('spell-count').textContent = spellCount;
    document.getElementById('grammar-count').textContent = grammarCount;
}

// Tab switching logic with corrections visibility toggling
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const type = this.getAttribute('data-type');
        document.querySelectorAll('.correction-line').forEach(line => {
            line.style.display = (type === 'all' || line.getAttribute('data-type') === type) ? 'block' : 'none';
        });

        // Show corrections list when interacting with tabs
        document.getElementById('corrections-list').style.display = 'block';
    });
});

// Keep corrections visible when clicking inside corrections list
document.getElementById('corrections-list').addEventListener('click', function() {
    this.style.display = 'block';
});
