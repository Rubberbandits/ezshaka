const packagerPath = require.resolve('shaka-packager');
const { spawn } = require('child_process');

class ShakaInput {
    constructor(shaka, inputFile) {
        if (!inputFile) {
            throw new Error('Input file is required.');
        }
        this.inputFile = inputFile;
        this.argument = `in=${inputFile}`;
        this.shaka = shaka;
    }

    toString() {
        return `'${this.argument}'`;
    }

    stream(streamName) {
        if (!streamName) {
            throw new Error('Stream name is required.');
        }
        this.argument += `,stream=${streamName}`;
        return this;
    }

    format(format) {
        if (!format) {
            throw new Error('Format is required.');
        }
        this.argument += `,format=${format}`;
        return this;
    }

    output(outputFile) {
        if (!outputFile) {
            throw new Error('Output file is required.');
        }
        this.argument += `,output=${outputFile}`;
        return this;
    }

    initSegment(name) {
        if (!name) {
            throw new Error('Init segment name is required.');
        }
        this.argument += `,init_segment=${name}`;
        return this;
    }

    segmentTemplate(template) {
        if (!template) {
            throw new Error('Segment template is required.');
        }
        this.argument += `,segment_template=${template}`;
        return this;
    }

    dashOnly() {
        this.argument += ',dash_only=1';
        return this;
    }

    finish() {
        return this.shaka.finalizeInput(this);
    }
}

class EzShaka {
    constructor() {
        this.packager = null;
        this.args = [];
    }
    /**
     * Adds an input file to the packager.
     * @param {string} inputFile - The path to the input file.
     * @returns {EzShaka} - Returns the instance for method chaining.
     */
    input(inputFile) {
        if (!inputFile) {
            throw new Error('Input file is required.');
        }
        
        const input = new ShakaInput(this, inputFile);
        return input;
    }

    finalizeInput(input) {
        if (!(input instanceof ShakaInput)) {
            throw new Error('Invalid input type. Expected an instance of ShakaInput.');
        }

        this.args.push(input.toString());
        return this;
    }

    generateStaticLiveMpd() {
        this.args.push('--generate_static_live_mpd');
        return this;
    }

    mpdOutput(outputFile) {
        if (!outputFile) {
            throw new Error('Output file is required.');
        }
        this.args.push(`--mpd_output=${outputFile}`);
        return this;
    }

    hlsMasterPlaylistOutput(outputFile) {
        if (!outputFile) {
            throw new Error('Output file is required.');
        }
        this.args.push(`--hls_master_playlist_output=${outputFile}`);
        return this;
    }
    
    start() {
        return new Promise((resolve, reject) => {
            if (this.packager) {
                console.error('Packager is already running.');
                return reject(new Error('Packager is already running.'));
            }
            this.packager = spawn(packagerPath, this.args, {
                stdio: 'inherit',
                shell: true,
                env: {
                    ...process.env,
                    PACKAGER_PATH: packagerPath,
                },
            });
        
            this.packager.on('error', (err) => {
                console.error('Failed to start packager:', err);
                reject(err);
            });
        
            this.packager.on('exit', (code) => {
                console.log(`Packager exited with code ${code}`);
                this.packager = null;
                resolve(code);
            });
        
            this.packager.on('close', (code) => {
                console.log(`Packager closed with code ${code}`);
                this.packager = null;
                resolve(code);
            });
        });
    }
}

module.exports = EzShaka;