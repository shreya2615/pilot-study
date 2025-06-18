// === Fixed: Audio then One-by-One Questions, Images Restored ===

const jsPsych = initJsPsych({
  on_finish: () => {
    fetch("https://script.google.com/macros/s/AKfycbxlf2qo2q94se7bWowfgxKXQSXE1Ll3wKmXWvmCv-8cBU8YguYzTcbh2-KxNUvGsoTUQg/exec", {
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
    <p><strong>Complete this form before proceeding:</strong><br>
    <a href="https://docs.google.com/forms/d/e/1FAIpQLSekKKNoYVKAJmO7hAJdm-faJbXRo3Yv8LbsFzgvLKDzFORfvg/viewform?usp=header" target="_blank">Click here</a></p>
    <p>Press SPACE to continue or 0 to exit.</p>`,
  choices: [' ', '0'],
  on_finish: data => { if (data.response === 48) jsPsych.endExperiment("You chose not to participate."); }
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<p>You will first see a pair of audio clips. You must play both before continuing. Then, you will be asked four questions one at a time.</p>
    <p>Use keys 1 or 2 to respond. Press SPACE to begin.</p>`,
  choices: [' ']
};

let timeline = [consent, instructions];

// === IMAGE COMPARISONS RESTORED ===
blockOrder.forEach(blockKey => {
  const faceNums = imageBlocks[blockKey];
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
            <p><b>Review both images and answer:</b></p>
            <div style='display:flex; justify-content:space-around;'>
              <img src='all_images/${img1}' height='200'>
              <img src='all_images/${img2}' height='200'>
            </div>
            <p><strong>${question}</strong></p>
            <p>Press 1 for left, 2 for right.</p>
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
});

// === AUDIO TRIALS: AUDIO FIRST, THEN QUESTIONS ONE BY ONE ===
blockOrder.forEach(blockKey => {
  const audioNums = audioBlocks[blockKey];
  audioNums.forEach(audioNum => {
    const audioID = audioNum.toString().padStart(2, "0");
    audioPairs.forEach(([p1, p2]) => {
      const audio1File = `all_audios/${group}_voice${audioID}_pitch${p1}.wav`;
      const audio2File = `all_audios/${group}_voice${audioID}_pitch${p2}.wav`;

      // AUDIO TRIAL ONLY
      timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
          <div style="text-align:center;">
            <p style="font-size:12px;">BLOCK: ${blockKey.toUpperCase()} (Audio)</p>
            <p><strong>Please play both audios before continuing.</strong></p>
            <div style="display: flex; justify-content: center; gap: 50px;">
              <div><audio id="audio1" controls><source src="${audio1File}" type="audio/wav"></audio></div>
              <div><audio id="audio2" controls><source src="${audio2File}" type="audio/wav"></audio></div>
            </div>
            <p style="margin-top:20px;">Press SPACE after both have played.</p>
          </div>
        `,
        choices: [' '],
        on_load: () => {
          const a1 = document.getElementById("audio1");
          const a2 = document.getElementById("audio2");
          let done1 = false, done2 = false;
          const allowContinue = e => {
            if (e.code === "Space" && done1 && done2) {
              document.removeEventListener("keydown", allowContinue);
              jsPsych.finishTrial();
            }
          };
          a1.addEventListener("ended", () => { done1 = true; });
          a2.addEventListener("ended", () => { done2 = true; });
          document.addEventListener("keydown", allowContinue);
        },
        data: {
          modality: "audio_intro",
          audio_left: audio1File,
          audio_right: audio2File,
          audio_number: audioNum,
          block: blockKey,
          group: group
        }
      });

      // 4 QUESTION TRIALS, ONE BY ONE
      questions.forEach((question, index) => {
        timeline.push({
          type: jsPsychHtmlKeyboardResponse,
          stimulus: `<p><strong>${question}</strong></p><p>Press 1 for first voice, 2 for second voice.</p>`,
          choices: ['1', '2'],
          data: {
            modality: "audio_question",
            question: question,
            question_index: index + 1,
            audio_left: audio1File,
            audio_right: audio2File,
            audio_number: audioNum,
            block: blockKey,
            group: group
          }
        });
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