import mongoose from 'mongoose';
import { assign, some } from 'lodash';
import ExampleSuggestion from '../models/ExampleSuggestion';
import { prepResponse, handleQueries } from './utils';

/* Creates a new ExampleSuggestion document in the database */
export const postExampleSuggestion = (req, res) => {
  const { body: data } = req;

  if (!data.igbo && !data.english) {
    res.status(400);
    return res.send({ error: 'Required information is missing, double check your provided data' });
  }

  if (some(data.associatedWords, (associatedWord) => !mongoose.Types.ObjectId.isValid(associatedWord))) {
    res.status(400);
    return res.send({ error: 'Invalid id found in associatedWords' });
  }

  const newExampleSuggestion = new ExampleSuggestion(data);
  return newExampleSuggestion.save()
    .then((exampleSuggestion) => (
      res.send({ id: exampleSuggestion.id })
    ))
    .catch(() => {
      res.status(400);
      return res.send('An error has occurred while saving, double check your provided data');
    });
};

/* Updates an existing ExampleSuggestion object */
export const putExampleSuggestion = (req, res) => {
  const { body: data, params: { id } } = req;

  if (!data.igbo && !data.english) {
    res.status(400);
    return res.send({ error: 'Required information is missing, double check your provided data' });
  }

  return ExampleSuggestion.findById(id)
    .then(async (exampleSuggestion) => {
      if (!exampleSuggestion) {
        res.status(400);
        return res.send({ error: 'Example suggestion doesn\'t exist' });
      }
      const updatedExampleSuggestion = assign(exampleSuggestion, data);
      return res.send(await updatedExampleSuggestion.save());
    })
    .catch(() => {
      res.status(400);
      return res.send('An error has occurred while updating, double check your provided data');
    });
};

/* Returns all existing ExampleSuggestion objects */
export const getExampleSuggestions = (req, res) => {
  const { regexKeyword, page, sort } = handleQueries(req.query);
  return ExampleSuggestion
    .find({ $or: [{ igbo: regexKeyword }, { english: regexKeyword }] })
    .sort({ approvals: 'desc' })
    .then((exampleSuggestions) => (
      prepResponse(res, exampleSuggestions, page, sort)
    ))
    .catch(() => {
      res.status(400);
      return res.send('An error has occurred while return example suggestions, double check your provided data');
    });
};

export const findExampleSuggestionById = (id) => (
  ExampleSuggestion.findById(id)
);

/* Returns a single ExampleSuggestion by using an id */
export const getExampleSuggestion = (req, res) => {
  const { id } = req.params;
  return findExampleSuggestionById(id)
    .then((exampleSuggestion) => {
      if (!exampleSuggestion) {
        res.status(400);
        return res.send({ error: 'No example suggestion exists with the provided id.' });
      }
      return res.send(exampleSuggestion);
    })
    .catch(() => {
      res.status(400);
      return res.send({ error: 'An error has occurred while returning a single example suggestion' });
    });
};
