"""
Python Inference Server

Standalone Python process that loads the trained LSTM model and
responds to inference requests from the TypeScript engine via stdin/stdout.

@module InferenceServer
@version 1.0.0
"""

import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
import pickle
import argparse
from typing import Dict, List, Any


class InferenceServer:
    """
    Lightweight inference server for real-time predictions
    """

    def __init__(self, model_path: str, scaler_path: str, metadata_path: str):
        """
        Initialize inference server

        Args:
            model_path: Path to trained Keras model
            scaler_path: Path to feature scaler
            metadata_path: Path to model metadata JSON
        """
        print(f"Loading model from {model_path}...", file=sys.stderr)
        self.model = keras.models.load_model(model_path)

        print(f"Loading scaler from {scaler_path}...", file=sys.stderr)
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)

        print(f"Loading metadata from {metadata_path}...", file=sys.stderr)
        with open(metadata_path, 'r') as f:
            self.metadata = json.load(f)

        self.sequence_length = self.metadata['sequence_length']
        self.n_features = self.metadata['n_features']
        self.feature_names = self.metadata['feature_names']
        self.class_names = self.metadata['class_names']
        self.confidence_threshold = 0.6

        print("Inference server ready", file=sys.stderr)
        print("ready", flush=True)  # Signal to parent process

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process inference request

        Args:
            request: Dictionary with 'id' and 'features' keys

        Returns:
            Dictionary with prediction results
        """
        try:
            request_id = request['id']
            features = request['features']

            # Validate input
            if len(features) != self.sequence_length:
                return {
                    'id': request_id,
                    'error': f'Expected {self.sequence_length} feature windows, got {len(features)}'
                }

            # Convert features to numpy array
            feature_array = np.array([
                [window[fname] for fname in self.feature_names]
                for window in features
            ])

            # Scale features
            n_windows, n_feat = feature_array.shape
            feature_flat = feature_array.reshape(-1, n_feat)
            feature_scaled = self.scaler.transform(feature_flat)
            feature_array = feature_scaled.reshape(n_windows, n_feat)

            # Add batch dimension
            X = feature_array.reshape(1, self.sequence_length, self.n_features)

            # Predict
            probabilities = self.model.predict(X, verbose=0)[0]
            predicted_class = int(np.argmax(probabilities))
            confidence = float(probabilities[predicted_class])

            # Build result
            result = {
                'id': request_id,
                'result': {
                    'predicted_state': self.class_names[predicted_class],
                    'confidence': confidence,
                    'probabilities': {
                        self.class_names[i]: float(prob)
                        for i, prob in enumerate(probabilities)
                    },
                    'intervention_recommended': (
                        self.class_names[predicted_class] in ['unproductive_struggle', 'disengaged']
                        and confidence >= self.confidence_threshold
                    )
                }
            }

            return result

        except Exception as e:
            return {
                'id': request.get('id', 'unknown'),
                'error': str(e)
            }

    def run(self):
        """
        Main server loop - read from stdin, write to stdout
        """
        print("Listening for requests on stdin...", file=sys.stderr)

        for line in sys.stdin:
            try:
                line = line.strip()
                if not line:
                    continue

                request = json.loads(line)
                response = self.process_request(request)

                # Write response to stdout
                print(json.dumps(response), flush=True)

            except json.JSONDecodeError as e:
                error_response = {
                    'id': 'unknown',
                    'error': f'Invalid JSON: {str(e)}'
                }
                print(json.dumps(error_response), flush=True)

            except Exception as e:
                error_response = {
                    'id': 'unknown',
                    'error': f'Server error: {str(e)}'
                }
                print(json.dumps(error_response), flush=True)
                print(f"Error processing request: {e}", file=sys.stderr)


def main():
    """
    Entry point for inference server
    """
    parser = argparse.ArgumentParser(description='LSTM Inference Server')
    parser.add_argument('--model', required=True, help='Path to Keras model file')
    parser.add_argument('--scaler', required=True, help='Path to feature scaler file')
    parser.add_argument('--metadata', required=True, help='Path to model metadata JSON')

    args = parser.parse_args()

    try:
        server = InferenceServer(args.model, args.scaler, args.metadata)
        server.run()
    except KeyboardInterrupt:
        print("\nShutting down inference server...", file=sys.stderr)
        sys.exit(0)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
