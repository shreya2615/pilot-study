// === Updated Audio Trial with Questions on Same Screen ===

const jsPsych = initJsPsych({
  on_finish: () => {
    fetch("https://script.google.com/macros/s/AKfycbxlf2qo2q94se7bWowfgxKXQSXE1Ll3wKmXWvmCv-8cBU8YguYzTcbh2-KxNUvGsoTUQg/exec", {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jsPsych.data.get().values())
    });
  }
});

const group = jsPsych.randomization.sampleWithoutReplacement(["male", "female"], 1)[0];
const participantID = jsPsych.data.getURLVariable("id") || Math.floor(Math.random() * 10000);
const blockOrders = [["a", "b", "c"], ["b", "c", "a"], ["c", "a", "b"]];
const blockOrder = blockOrders[participantID % 3];

const imageBlocks = { a: [1, 2, 3], b: [4, 5, 6], c: [7, 8, 9, 10] };
const audioBlocks = { a: [1, 2, 3, 4, 5, 6], b: [7, 8, 9, 10, 11, 12, 13], c: [14, 15, 16, 17, 18, 19, 20] };
const facePairs = [[1, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 6]];
const audioPairs = [[1, 2], [1, 3], [2, 3]];
const questions = [
  "Who do you think is more dominant?",
  "Who do you think is more trustworthy?",
  "Who do you think is more honest?",
  "Who do you think is taller?"
];

const consent = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Consent Form</h2>
    <p>By participating, you agree to take part in this study.</p>
    <p style="margin-top: 20px;">
      <strong>Please complete this form before proceeding:</strong><br>
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSekKKNoYVKAJmO7hAJdm-faJbXRo3Yv8LbsFzgvLKDzFORfvg/viewform?usp=header" target="_blank"
         style="font-size:18px; color:blue; text-decoration:underline; display:inline-block; margin-top:10px;">
        👉 Click here to open the Google Form
      </a>
    </p>
    <p style="margin-top: 40px;">Press SPACE to continue or 0 to exit.</p>
  `,
  choices: [' ', '0'],
  on_finish: data => {
    if (data.response === 48) jsPsych.endExperiment("You chose not to participate.");
  }
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>The experiment proceeds in 3 blocks, in each block you will first be required to view sets of images and answer the corresponding questions, then you will be required to listen to sets of audio comparisons and answer corresponding questions.</p>
    <p>Use the keys 1 or 2 to respond (1 = Left/First, 2 = Right/Second).</p>
    <p>Press SPACE to begin.</p>
  `,
  choices: [' ']
};

let timeline = [consent, instructions];

blockOrder.forEach(blockKey => {
  const audioNums = audioBlocks[blockKey];

  audioNums.forEach(audioNum => {
    const audioID = audioNum.toString().padStart(2, "0");

    audioPairs.forEach(([p1, p2]) => {
      const audio1File = `all_audios/${group}_voice${audioID}_pitch${p1}.wav`;
      const audio2File = `all_audios/${group}_voice${audioID}_pitch${p2}.wav`;

      timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
          <div style="text-align:center;">
            <p style="font-size:12px;">BLOCK: ${blockKey.toUpperCase()} (Audio)</p>
            <p><strong>Please play both audios before answering the questions.</strong></p>
            <div style="display: flex; justify-content: center; gap: 50px; margin-bottom: 10px;">
              <div><audio id="audio1" controls><source src="${audio1File}" type="audio/wav"></audio></div>
              <div><audio id="audio2" controls><source src="${audio2File}" type="audio/wav"></audio></div>
            </div>
            <form id="questionForm">
              ${questions.map((q, i) => `
                <p><strong>${q}</strong></p>
                <label><input type="radio" name="q${i}" value="1" disabled> 1 (First)</label>
                <label><input type="radio" name="q${i}" value="2" disabled> 2 (Second)</label>
              `).join('<br>')}
            </form>
          `,
        choices: ['Continue'],
        button_html: '<button class="jspsych-btn" disabled id="continueBtn">%choice%</button>',
        on_load: () => {
          const audio1 = document.getElementById('audio1');
          const audio2 = document.getElementById('audio2');
          const continueBtn = document.getElementById('continueBtn');
          const form = document.getElementById('questionForm');
          let played1 = false, played2 = false;

          const enableInputs = () => {
            if (played1 && played2) {
              form.querySelectorAll('input[type="radio"]').forEach(el => el.disabled = false);
              continueBtn.disabled = false;
            }
          };

          audio1.addEventListener('ended', () => { played1 = true; enableInputs(); });
          audio2.addEventListener('ended', () => { played2 = true; enableInputs(); });
        },
        on_finish: () => {
          const responses = {};
          questions.forEach((q, i) => {
            const selected = document.querySelector(`input[name="q${i}"]:checked`);
            responses[`Q${i + 1}`] = selected ? selected.value : '';
          });
          jsPsych.data.write({
            modality: "audio",
            audio_left: audio1File,
            audio_right: audio2File,
            audio_number: audioNum,
            group: group,
            block: blockKey,
            responses
          });
        }
      });
    });
  });
});

timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <h2>Thank you for participating!</h2>
    <p>Your responses have been recorded.</p>
    <p>You may now close this window.</p>
  `,
  choices: "NO_KEYS",
  trial_duration: 5000
});

jsPsych.run(timeline);

