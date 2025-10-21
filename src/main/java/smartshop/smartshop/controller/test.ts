//geneerate a typescript file for testing purpose
import { Request, Response } from 'express';

export const testController = (req: Request, res: Response) => {
    res.status(200).json({ message: 'Test controller is working!' });
}