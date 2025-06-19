// === Audio Trial with Sequential Questions Under Same Screen ===

const jsPsych = initJsPsych({
  on_data_update: () => {
    fetch("https://script.google.com/macros/s/AKfycbxeLHPVsOgCAbzzZFzvLi4cBvm3CIDqgs5zA9xpD0xGHUTTJaCQN03rgT6eVyW9TKD7/exec", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
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
  stimulus: `<h2>Consent Form</h2><p>By participating, you agree to take part in this study.</p>
    <p><strong>Please complete this form before proceeding:</strong><br>
    <a href="https://docs.google.com/forms/d/e/1FAIpQLSekKKNoYVKAJmO7hAJdm-faJbXRo3Yv8LbsFzgvLKDzFORfvg/viewform?usp=header" target="_blank">Click here</a></p>
    <p>Press SPACE to continue.</p>`,
  choices: [' ', '0'],
  on_finish: data => { if (data.response === 48) jsPsych.endExperiment("You chose not to participate."); }
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>The study will proceed in 3 blocks. In each block you will first see pairs of images followed by 4 questions for each pair. Then, you will see pairs of audios followed by 4 questions for each pair.</p>
    <p>Use keys 1 or 2 to respond. Press SPACE to begin the experiment.</p>`,
  choices: [' ']
};

let timeline = [consent, instructions];

blockOrder.forEach(blockKey => {
  const faceNums = imageBlocks[blockKey];
  const audioNums = audioBlocks[blockKey];

  // IMAGE TRIALS
  faceNums.forEach(faceNum => {
    const faceID = faceNum.toString().padStart(2, "0");
    facePairs.forEach(([v1, v2]) => {
      const img1 = `${group}_face${faceID}_${v1}.png`;
      const img2 = `${group}_face${faceID}_${v2}.png`;
      questions.forEach((question, index) => {
        timeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `
            <p style='font-size:12px;'>BLOCK: ${blockKey.toUpperCase()} (Image)</p>
            <p><b>Review both images and answer the questions below:</b></p>
            <div style='display:flex; justify-content:space-around;'>
              <img src='all_images/${img1}' height='200'>
              <img src='all_images/${img2}' height='200'>
            </div>
            <p><strong>${question}</strong></p>
            <p>Press 1 for the left image or 2 for right image.</p>
          `,
          choices: ['1', '2'],
          data: {
            modality: "image",
            image_left: img1,
            image_right: img2,
            question: question,
            question_index: index + 1,
            face_number: faceNum,
            group: group,
            block: blockKey
          }
        });
      });
    });
  });

  // AUDIO TRIALS
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
            <p><strong>Please play both audios and liste carefully. Questions will appear below after both are played.</strong></p>
            <div style="display: flex; justify-content: center; gap: 50px;">
              <audio id="audio1" controls><source src="${audio1File}" type="audio/wav"></audio>
              <audio id="audio2" controls><source src="${audio2File}" type="audio/wav"></audio>
            </div>
            <div id="question-box" style="margin-top:30px;"></div>
            <p id="instructions" style="margin-top:20px;"></p>
          </div>
        `,
        choices: "NO_KEYS",
        on_load: () => {
          const a1 = document.getElementById("audio1");
          const a2 = document.getElementById("audio2");
          const box = document.getElementById("question-box");
          const instr = document.getElementById("instructions");
          let done1 = false, done2 = false;
          let currentQ = 0;
          let responses = [];

          const showNextQuestion = () => {
            if (currentQ < questions.length) {
              box.innerHTML = `<p><strong>${questions[currentQ]}</strong></p><p>Press 1 or 2</p>`;
              jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: info => {
                  responses.push({
                    question: questions[currentQ],
                    response: info.key,
                    rt: info.rt
                  });
                  currentQ++;
                  showNextQuestion();
                },
                valid_responses: ['1', '2'],
                rt_method: 'performance',
                persist: false,
                allow_held_key: false
              });
            } else {
              jsPsych.finishTrial({
                modality: "audio",
                audio_left: audio1File,
                audio_right: audio2File,
                audio_number: audioNum,
                block: blockKey,
                group: group,
                responses: responses
              });
            }
          };

          const checkReady = () => {
            if (done1 && done2) {
              instr.innerHTML = "You may now begin answering. Press 1 for the left audio or 2 for the right audio.";
              showNextQuestion();
            }
          };

          a1.addEventListener("ended", () => { done1 = true; checkReady(); });
          a2.addEventListener("ended", () => { done2 = true; checkReady(); });
        }
      });
    });
  });
});

timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<h2>Thank you for participating!</h2><p>Your responses have been recorded. You may now close this window.</p>`,
  choices: "NO_KEYS",
  trial_duration: 5000
});

jsPsych.run(timeline);
