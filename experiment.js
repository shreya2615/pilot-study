// === Audio + All Questions on One Screen After Playback ===

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
    <p>The experiment proceeds in 3 blocks. In each block, you will first see a pair of audio clips. You must play both before answering any questions. Then, you will be asked four questions on the same screen.</p>
    <p>Use the keys 1 or 2 to respond to each question (1 = First voice, 2 = Second voice).</p>
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
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <div style="text-align:center;">
            <p style="font-size:12px;">BLOCK: ${blockKey.toUpperCase()} (Audio)</p>
            <p><strong>Please play both audios before answering the questions.</strong></p>
            <div style="display: flex; justify-content: center; gap: 50px; margin-bottom: 10px;">
              <div><audio id="audio1" controls><source src="${audio1File}" type="audio/wav"></audio></div>
              <div><audio id="audio2" controls><source src="${audio2File}" type="audio/wav"></audio></div>
            </div>
            <p><strong>${questions[0]}</strong><br>Press 1 or 2</p>
          </div>
        `,
        choices: ['1', '2'],
        on_load: () => {
          const audio1 = document.getElementById('audio1');
          const audio2 = document.getElementById('audio2');
          let played1 = false, played2 = false;

          const listener = (e) => {
            if ((e.code === "Digit1" || e.code === "Digit2") && played1 && played2) {
              jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: () => jsPsych.finishTrial(),
                valid_responses: ['1', '2'],
                rt_method: 'performance',
                persist: false,
                allow_held_key: false
              });
              document.removeEventListener("keydown", listener);
            }
          };

          audio1.addEventListener("ended", () => { played1 = true; });
          audio2.addEventListener("ended", () => { played2 = true; });
          document.addEventListener("keydown", listener);
        },
        data: {
          modality: "audio_question",
          question: questions[0],
          question_index: 1,
          audio_left: audio1File,
          audio_right: audio2File,
          audio_number: audioNum,
          block: blockKey,
          group: group
        }
      });

      // Repeat for the other 3 questions
      for (let i = 1; i < questions.length; i++) {
        timeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `
            <div style="text-align:center;">
              <p><strong>${questions[i]}</strong></p>
              <p>Press 1 for first voice, 2 for second voice.</p>
            </div>
          `,
          choices: ['1', '2'],
          data: {
            modality: "audio_question",
            question: questions[i],
            question_index: i + 1,
            audio_left: audio1File,
            audio_right: audio2File,
            audio_number: audioNum,
            block: blockKey,
            group: group
          }
        });
      }
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
