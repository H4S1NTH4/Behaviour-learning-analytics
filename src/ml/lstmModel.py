"""
LSTM Model for Student Struggle Detection

This module implements a Long Short-Term Memory (LSTM) neural network
for predicting student cognitive and affective states from behavioral data.

Key States Detected:
- Flow / Engagement
- Productive Struggle
- Unproductive Struggle / Flailing
- Disengagement

@module LSTMModel
@version 1.0.0
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from keras import layers, models, callbacks
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from typing import Tuple, List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import pickle
from datetime import datetime

# Enable GPU if available
physical_devices = tf.config.list_physical_devices('GPU')
if len(physical_devices) > 0:
    tf.config.experimental.set_memory_growth(physical_devices[0], True)
    print(f"GPU detected: {physical_devices[0]}")
else:
    print("No GPU detected, using CPU")


class BehavioralStateClassifier:
    """
    LSTM-based classifier for student behavioral state detection
    """

    def __init__(
        self,
        sequence_length: int = 6,  # 6 windows of 30 seconds = 3 minutes
        n_features: int = 25,
        n_classes: int = 4,
        lstm_units: int = 128,
        dropout_rate: float = 0.3,
        learning_rate: float = 0.001
    ):
        """
        Initialize the LSTM model architecture

        Args:
            sequence_length: Number of time windows in sequence
            n_features: Number of input features per window
            n_classes: Number of behavioral states to predict
            lstm_units: Number of LSTM units per layer
            dropout_rate: Dropout rate for regularization
            learning_rate: Learning rate for Adam optimizer
        """
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.n_classes = n_classes
        self.lstm_units = lstm_units
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate

        self.model: Optional[keras.Model] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.class_names = [
            'flow',
            'productive_struggle',
            'unproductive_struggle',
            'disengaged'
        ]

        print(f"Initialized LSTM classifier: {sequence_length}x{n_features} -> {n_classes} classes")

    def build_model(self) -> keras.Model:
        """
        Build LSTM architecture with attention mechanism

        Architecture:
        1. Input Layer (sequence_length, n_features)
        2. LSTM Layer 1 (return sequences)
        3. Dropout
        4. LSTM Layer 2 (return sequences)
        5. Attention Layer
        6. Dense Layer
        7. Dropout
        8. Output Layer (softmax)
        """
        inputs = keras.Input(shape=(self.sequence_length, self.n_features), name='feature_sequence')

        # First LSTM layer
        x = layers.LSTM(
            self.lstm_units,
            return_sequences=True,
            name='lstm_1'
        )(inputs)
        x = layers.Dropout(self.dropout_rate, name='dropout_1')(x)

        # Second LSTM layer
        x = layers.LSTM(
            self.lstm_units // 2,
            return_sequences=True,
            name='lstm_2'
        )(x)
        x = layers.Dropout(self.dropout_rate, name='dropout_2')(x)

        # Attention mechanism (self-attention)
        attention = layers.Dense(1, activation='tanh', name='attention_weights')(x)
        attention = layers.Flatten()(attention)
        attention = layers.Activation('softmax', name='attention_softmax')(attention)
        attention = layers.RepeatVector(self.lstm_units // 2)(attention)
        attention = layers.Permute([2, 1], name='attention_permute')(attention)

        # Apply attention
        x = layers.Multiply(name='attention_multiply')([x, attention])
        x = layers.Lambda(lambda xin: tf.reduce_sum(xin, axis=1), name='attention_sum')(x)

        # Dense layers
        x = layers.Dense(64, activation='relu', name='dense_1')(x)
        x = layers.Dropout(self.dropout_rate, name='dropout_3')(x)
        x = layers.Dense(32, activation='relu', name='dense_2')(x)

        # Output layer
        outputs = layers.Dense(
            self.n_classes,
            activation='softmax',
            name='output'
        )(x)

        model = keras.Model(inputs=inputs, outputs=outputs, name='behavioral_lstm')

        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )

        self.model = model
        print("\nModel architecture:")
        model.summary()

        return model

    def prepare_sequences(
        self,
        features_df: pd.DataFrame,
        labels_df: Optional[pd.DataFrame] = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Convert feature dataframe into sequences for LSTM

        Args:
            features_df: DataFrame with features (sorted by user_id, time)
            labels_df: Optional DataFrame with ground truth labels

        Returns:
            X: Sequences of shape (n_samples, sequence_length, n_features)
            y: One-hot encoded labels of shape (n_samples, n_classes) or None
        """
        sequences = []
        labels = []

        # Group by user and session
        for (user_id, session_id), group in features_df.groupby(['user_id', 'session_id']):
            group = group.sort_values('time_window_start')

            # Slide window across session
            for i in range(len(group) - self.sequence_length + 1):
                sequence = group.iloc[i:i + self.sequence_length]
                feature_values = sequence[self.feature_names].values

                sequences.append(feature_values)

                # If labels provided, take label of last window in sequence
                if labels_df is not None:
                    last_window_id = sequence.iloc[-1]['window_id']
                    label_row = labels_df[labels_df['window_id'] == last_window_id]
                    if not label_row.empty:
                        labels.append(label_row.iloc[0]['state_label'])

        X = np.array(sequences)

        if labels_df is not None:
            # Convert labels to one-hot encoding
            label_encoder = {state: i for i, state in enumerate(self.class_names)}
            y_indices = [label_encoder[label] for label in labels]
            y = keras.utils.to_categorical(y_indices, num_classes=self.n_classes)
            return X, y
        else:
            return X, None

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        epochs: int = 50,
        batch_size: int = 32,
        early_stopping_patience: int = 10
    ) -> keras.callbacks.History:
        """
        Train the LSTM model

        Args:
            X_train: Training sequences
            y_train: Training labels (one-hot)
            X_val: Validation sequences
            y_val: Validation labels (one-hot)
            epochs: Maximum training epochs
            batch_size: Batch size
            early_stopping_patience: Early stopping patience

        Returns:
            Training history
        """
        if self.model is None:
            self.build_model()

        # Callbacks
        early_stop = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=early_stopping_patience,
            restore_best_weights=True,
            verbose=1
        )

        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            verbose=1
        )

        checkpoint = callbacks.ModelCheckpoint(
            'models/lstm_checkpoint.keras',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )

        tensorboard = callbacks.TensorBoard(
            log_dir=f'logs/fit/{datetime.now().strftime("%Y%m%d-%H%M%S")}',
            histogram_freq=1
        )

        # Class weights for imbalanced data
        class_weights = self._calculate_class_weights(y_train)

        # Train
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stop, reduce_lr, checkpoint, tensorboard],
            class_weight=class_weights,
            verbose=1
        )

        return history

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict behavioral states for sequences

        Args:
            X: Input sequences of shape (n_samples, sequence_length, n_features)

        Returns:
            predictions: Class indices
            probabilities: Class probabilities
        """
        if self.model is None:
            raise ValueError("Model not trained yet")

        probabilities = self.model.predict(X)
        predictions = np.argmax(probabilities, axis=1)

        return predictions, probabilities

    def predict_with_confidence(
        self,
        X: np.ndarray,
        confidence_threshold: float = 0.6
    ) -> List[Dict[str, any]]:
        """
        Predict with confidence scores and interpretation

        Args:
            X: Input sequences
            confidence_threshold: Minimum confidence for prediction

        Returns:
            List of prediction dictionaries
        """
        predictions, probabilities = self.predict(X)

        results = []
        for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
            confidence = probs[pred]
            state = self.class_names[pred]

            result = {
                'sequence_index': i,
                'predicted_state': state,
                'confidence': float(confidence),
                'probabilities': {
                    self.class_names[j]: float(prob)
                    for j, prob in enumerate(probs)
                },
                'high_confidence': confidence >= confidence_threshold,
                'intervention_recommended': state in ['unproductive_struggle', 'disengaged'] and confidence >= confidence_threshold
            }

            results.append(result)

        return results

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """
        Evaluate model on test set

        Args:
            X_test: Test sequences
            y_test: Test labels (one-hot)

        Returns:
            Dictionary of evaluation metrics
        """
        if self.model is None:
            raise ValueError("Model not trained yet")

        # Get predictions
        test_loss, test_acc, test_precision, test_recall = self.model.evaluate(X_test, y_test, verbose=0)

        predictions, probabilities = self.predict(X_test)
        y_true = np.argmax(y_test, axis=1)

        # Calculate F1 score per class
        from sklearn.metrics import f1_score, confusion_matrix, classification_report

        f1_macro = f1_score(y_true, predictions, average='macro')
        f1_weighted = f1_score(y_true, predictions, average='weighted')

        conf_matrix = confusion_matrix(y_true, predictions)
        class_report = classification_report(y_true, predictions, target_names=self.class_names)

        print("\nEvaluation Results:")
        print(f"Test Accuracy: {test_acc:.4f}")
        print(f"Test Precision: {test_precision:.4f}")
        print(f"Test Recall: {test_recall:.4f}")
        print(f"F1 Score (Macro): {f1_macro:.4f}")
        print(f"F1 Score (Weighted): {f1_weighted:.4f}")
        print("\nClassification Report:")
        print(class_report)
        print("\nConfusion Matrix:")
        print(conf_matrix)

        return {
            'accuracy': float(test_acc),
            'precision': float(test_precision),
            'recall': float(test_recall),
            'f1_macro': float(f1_macro),
            'f1_weighted': float(f1_weighted),
            'confusion_matrix': conf_matrix.tolist()
        }

    def save(self, model_path: str, scaler_path: str, metadata_path: str):
        """
        Save model, scaler, and metadata

        Args:
            model_path: Path to save Keras model
            scaler_path: Path to save feature scaler
            metadata_path: Path to save metadata JSON
        """
        if self.model is None:
            raise ValueError("Model not trained yet")

        # Save model
        self.model.save(model_path)
        print(f"Model saved to {model_path}")

        # Save scaler
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        print(f"Scaler saved to {scaler_path}")

        # Save metadata
        metadata = {
            'sequence_length': self.sequence_length,
            'n_features': self.n_features,
            'n_classes': self.n_classes,
            'feature_names': self.feature_names,
            'class_names': self.class_names,
            'lstm_units': self.lstm_units,
            'dropout_rate': self.dropout_rate,
            'learning_rate': self.learning_rate,
            'created_at': datetime.now().isoformat()
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"Metadata saved to {metadata_path}")

    @classmethod
    def load(cls, model_path: str, scaler_path: str, metadata_path: str):
        """
        Load trained model from disk

        Args:
            model_path: Path to Keras model
            scaler_path: Path to scaler
            metadata_path: Path to metadata JSON

        Returns:
            Loaded BehavioralStateClassifier instance
        """
        # Load metadata
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        # Create instance
        instance = cls(
            sequence_length=metadata['sequence_length'],
            n_features=metadata['n_features'],
            n_classes=metadata['n_classes'],
            lstm_units=metadata['lstm_units'],
            dropout_rate=metadata['dropout_rate'],
            learning_rate=metadata['learning_rate']
        )

        # Load model
        instance.model = keras.models.load_model(model_path)
        print(f"Model loaded from {model_path}")

        # Load scaler
        with open(scaler_path, 'rb') as f:
            instance.scaler = pickle.load(f)
        print(f"Scaler loaded from {scaler_path}")

        instance.feature_names = metadata['feature_names']
        instance.class_names = metadata['class_names']

        return instance

    def _calculate_class_weights(self, y_train: np.ndarray) -> Dict[int, float]:
        """
        Calculate class weights for imbalanced data

        Args:
            y_train: One-hot encoded training labels

        Returns:
            Dictionary of class weights
        """
        y_indices = np.argmax(y_train, axis=1)
        class_counts = np.bincount(y_indices)
        total_samples = len(y_indices)

        class_weights = {}
        for i, count in enumerate(class_counts):
            if count > 0:
                class_weights[i] = total_samples / (len(class_counts) * count)
            else:
                class_weights[i] = 1.0

        print("\nClass weights:", class_weights)
        return class_weights


def load_data_from_database(
    db_config: Dict[str, str],
    min_date: Optional[str] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load feature data and labels from PostgreSQL database

    Args:
        db_config: Database connection configuration
        min_date: Minimum date filter (YYYY-MM-DD)

    Returns:
        features_df: DataFrame with features
        labels_df: DataFrame with ground truth labels
    """
    conn = psycopg2.connect(**db_config, cursor_factory=RealDictCursor)
    cursor = conn.cursor()

    # Load features
    features_query = """
        SELECT
            kf.*,
            cs.assignment_id
        FROM keystroke_features kf
        JOIN coding_sessions cs ON kf.session_id = cs.session_id
        WHERE 1=1
    """
    if min_date:
        features_query += f" AND kf.time_window_start >= '{min_date}'"

    features_query += " ORDER BY kf.user_id, kf.session_id, kf.time_window_start"

    cursor.execute(features_query)
    features_df = pd.DataFrame(cursor.fetchall())

    # Load labels (you'll need to create this table with ground truth annotations)
    labels_query = """
        SELECT
            window_id,
            state_label
        FROM behavioral_labels
        WHERE 1=1
    """
    if min_date:
        labels_query += f" AND created_at >= '{min_date}'"

    cursor.execute(labels_query)
    labels_df = pd.DataFrame(cursor.fetchall())

    cursor.close()
    conn.close()

    return features_df, labels_df


def main_training_pipeline():
    """
    Full training pipeline for LSTM model
    """
    print("=" * 60)
    print("LSTM Behavioral State Classifier - Training Pipeline")
    print("=" * 60)

    # Database configuration
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'behavioral_analytics',
        'user': 'postgres',
        'password': 'your_password'
    }

    # Load data
    print("\n1. Loading data from database...")
    features_df, labels_df = load_data_from_database(db_config)
    print(f"Loaded {len(features_df)} feature windows and {len(labels_df)} labels")

    # Feature selection
    feature_columns = [
        'avg_dwell_time_ms', 'std_dwell_time_ms', 'avg_flight_time_ms', 'std_flight_time_ms',
        'avg_press_press_time_ms', 'typing_speed_wpm', 'backspace_frequency',
        'delete_frequency', 'error_correction_rate', 'pause_count', 'avg_pause_duration_ms',
        'burst_count', 'avg_burst_length', 'alphanumeric_ratio', 'special_char_ratio',
        'whitespace_ratio', 'modifier_usage_ratio', 'arrow_key_usage', 'min_dwell_time_ms',
        'max_dwell_time_ms', 'median_dwell_time_ms', 'max_pause_duration_ms',
        'typing_speed_cpm', 'std_press_press_time_ms', 'min_flight_time_ms'
    ]

    # Initialize classifier
    print("\n2. Initializing LSTM classifier...")
    classifier = BehavioralStateClassifier(
        sequence_length=6,
        n_features=len(feature_columns),
        n_classes=4,
        lstm_units=128,
        dropout_rate=0.3
    )
    classifier.feature_names = feature_columns

    # Prepare sequences
    print("\n3. Preparing sequences...")
    X, y = classifier.prepare_sequences(features_df, labels_df)
    print(f"Created {len(X)} sequences of shape {X[0].shape}")

    # Scale features
    print("\n4. Scaling features...")
    scaler = StandardScaler()
    n_samples, seq_len, n_feat = X.shape
    X_reshaped = X.reshape(-1, n_feat)
    X_scaled = scaler.fit_transform(X_reshaped)
    X = X_scaled.reshape(n_samples, seq_len, n_feat)
    classifier.scaler = scaler

    # Train/validation/test split
    print("\n5. Splitting data...")
    X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.15, random_state=42)
    X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.18, random_state=42)

    print(f"Train: {len(X_train)}, Validation: {len(X_val)}, Test: {len(X_test)}")

    # Build and train model
    print("\n6. Building model...")
    classifier.build_model()

    print("\n7. Training model...")
    history = classifier.train(
        X_train, y_train,
        X_val, y_val,
        epochs=50,
        batch_size=32,
        early_stopping_patience=10
    )

    # Evaluate
    print("\n8. Evaluating model...")
    metrics = classifier.evaluate(X_test, y_test)

    # Save model
    print("\n9. Saving model...")
    classifier.save(
        model_path='models/lstm_behavioral_model.keras',
        scaler_path='models/feature_scaler.pkl',
        metadata_path='models/model_metadata.json'
    )

    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)

    return classifier, history, metrics


if __name__ == "__main__":
    main_training_pipeline()
