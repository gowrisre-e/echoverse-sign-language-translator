import * as tf from '@tensorflow/tfjs';
import { createSimpleModel, saveModel, deleteModel } from './model';
import { prepareTrainingData, splitData, augmentData } from './preprocess';

/**
 * Training configuration
 */
const DEFAULT_CONFIG = {
  epochs: 50,
  batchSize: 32,
  validationSplit: 0.2,
  augment: true,
  augmentFactor: 2,
  earlyStoppingPatience: 10
};

/**
 * Train the gesture recognition model
 * @param {Object} trainingData - Collected training data { label: samples[] }
 * @param {Object} config - Training configuration
 * @param {Function} onProgress - Callback for training progress
 * @returns {Object} Training result { model, history }
 */
export const trainModel = async (trainingData, config = {}, onProgress = null) => {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Log training start
  console.log('Starting training with config:', cfg);

  // Augment data if enabled
  let data = trainingData;
  if (cfg.augment) {
    console.log('Augmenting training data...');
    data = augmentData(trainingData, cfg.augmentFactor);
  }

  // Prepare tensors
  console.log('Preparing training data...');
  const { xs, ys, count } = prepareTrainingData(data);
  console.log(`Total samples: ${count}`);

  // Split into train/val
  const { trainXs, trainYs, valXs, valYs } = splitData(xs, ys, cfg.validationSplit);
  console.log(`Training samples: ${trainXs.shape[0]}, Validation samples: ${valXs.shape[0]}`);

  // Create model (using simpler model for browser performance)
  console.log('Creating model...');
  const model = createSimpleModel();
  model.summary();

  // Training callbacks
  let bestValLoss = Infinity;
  let patience = 0;
  const history = {
    loss: [],
    accuracy: [],
    val_loss: [],
    val_accuracy: []
  };

  // Custom training loop for early stopping
  for (let epoch = 0; epoch < cfg.epochs; epoch++) {
    const result = await model.fit(trainXs, trainYs, {
      epochs: 1,
      batchSize: cfg.batchSize,
      validationData: [valXs, valYs],
      shuffle: true,
      verbose: 0
    });

    const loss = result.history.loss[0];
    const acc = result.history.acc[0];
    const valLoss = result.history.val_loss[0];
    const valAcc = result.history.val_acc[0];

    history.loss.push(loss);
    history.accuracy.push(acc);
    history.val_loss.push(valLoss);
    history.val_accuracy.push(valAcc);

    // Log progress
    console.log(`Epoch ${epoch + 1}/${cfg.epochs} - loss: ${loss.toFixed(4)}, acc: ${acc.toFixed(4)}, val_loss: ${valLoss.toFixed(4)}, val_acc: ${valAcc.toFixed(4)}`);

    if (onProgress) {
      onProgress({
        epoch: epoch + 1,
        totalEpochs: cfg.epochs,
        loss,
        accuracy: acc,
        valLoss,
        valAccuracy: valAcc
      });
    }

    // Early stopping
    if (valLoss < bestValLoss) {
      bestValLoss = valLoss;
      patience = 0;
    } else {
      patience++;
      if (patience >= cfg.earlyStoppingPatience) {
        console.log(`Early stopping at epoch ${epoch + 1}`);
        break;
      }
    }
  }

  // Cleanup tensors
  xs.dispose();
  ys.dispose();
  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();

  // Save model
  console.log('Saving model...');
  await saveModel(model);

  return { model, history };
};

/**
 * Evaluate model on test data
 * @param {tf.LayersModel} model - Trained model
 * @param {Object} testData - Test data { label: samples[] }
 * @returns {Object} Evaluation metrics
 */
export const evaluateModel = async (model, testData) => {
  const { xs, ys, count } = prepareTrainingData(testData);

  const result = model.evaluate(xs, ys);
  const [loss, accuracy] = await Promise.all([
    result[0].data(),
    result[1].data()
  ]);

  // Cleanup
  xs.dispose();
  ys.dispose();
  result[0].dispose();
  result[1].dispose();

  return {
    loss: loss[0],
    accuracy: accuracy[0],
    samples: count
  };
};

/**
 * Reset and delete existing model
 */
export const resetModel = async () => {
  await deleteModel();
  console.log('Model reset complete');
};

export default { trainModel, evaluateModel, resetModel };
