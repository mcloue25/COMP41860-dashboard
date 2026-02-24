import os 
import json 
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, _answer_correctness


def pretty_print_json(data):
    print(json.dumps(data, indent=4))

def load_FAQ_dataset(file_path):
    '''
    '''
    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)
        return data


def main():
    ''' Main function to:
            * Load the FAQ data
            * Initialise instance of ragas
            * genrate evaluation metrics
    '''
    dataset_path = 'data/ucd_studentdesk_faqs.json'
    data = load_FAQ_dataset(dataset_path)

    pretty_print_json(data)
if __name__=="__main__":
    main()