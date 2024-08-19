const Joi = require('joi');

module.exports = {
    createSchema: Joi.object({
        Acc_ID: Joi.number().required(),
        Campaign_Name: Joi.string().required(),
        Campaign_Description: Joi.string().allow(''),
        Campaign_TargetFund: Joi.number().required(),
        Campaign_Start: Joi.date().required(),
        Campaign_End: Joi.date().required(),
        Campaign_Status: Joi.number().required(),
        Campaign_Category: Joi.number().required(),
        Campaign_Feedback: Joi.number().allow(null)
    }),
    updateSchema: Joi.object({
        Campaign_Name: Joi.string().allow(''),
        Campaign_Description: Joi.string().allow(''),
        Campaign_TargetFund: Joi.number().allow(null),
        Campaign_Start: Joi.date().allow(null),
        Campaign_End: Joi.date().allow(null),
        Campaign_Status: Joi.number().allow(null),
        Campaign_Category: Joi.number().allow(null),
        Campaign_Feedback: Joi.number().allow(null)
    })
};
